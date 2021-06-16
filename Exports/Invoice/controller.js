(function(window, angular) {
    var app = angular.module("cab9.export");

    app.controller('DriverPaymentController', driverPaymentController);

    driverPaymentController.$inject = ['$scope', '$http', '$location', '$config', '$parse', '$filter'];

    function driverPaymentController($scope, $http, $location, $config, $parse, $filter) {
        $scope.invoiceId = $location.search().invoiceId;
        $scope.API_ENDPOINT = $config.API_ENDPOINT;

        $http({
            method: 'GET',
            url: $scope.API_ENDPOINT + 'api/Invoice/info',
            headers: {},
            params: {
                invoiceId: $scope.invoiceId
            }
        }).success(function(data) {
            $scope.dp = data;
            $scope.dp.Client.$Address = formatAddress($scope.dp.Client);
            $scope.DueDate = new moment(data.Payment.DueDate).add(30, 'days').format();
            $scope.groups = [];
            if (data.Payment.InvoiceGroupField) {
                var getter = null;
                switch (data.Payment.InvoiceGroupField) {
                    case 'Passenger':
                        getter = $parse("LeadPassenger.Firstname + ' ' + LeadPassenger.Surname");
                        break;
                    case 'Booker':
                        getter = $parse("ClientStaff.Firstname + ' ' + ClientStaff.Surname");
                        break;
                    case 'Reference':
                        getter = $parse("Reference");
                        break;
                    default:
                        getter = function(booking) {
                            var found = booking.BookingValidations.filter(function(bv) {
                                return bv.ClientReference.ReferenceName == data.Payment.InvoiceGroupField; })[0];
                            if (found) {
                                return found.Value;
                            } else {
                                return 'None';
                            }
                        }
                        break;
                }
                angular.forEach(data.Bookings, function(b) {
                    var value = getter(b);
                    var day = $scope.groups.filter(function(bd) {
                        return bd.title == data.Payment.InvoiceGroupField + ': ' + value;
                    })[0];
                    if (day) {
                        day.bookings.push(b);
                    } else {
                        $scope.groups.push({
                            title: data.Payment.InvoiceGroupField + ': ' + value,
                            bookings: [b]
                        })
                    }
                });
            } else {
                data.Bookings = $filter('orderBy')(data.Bookings, 'BookedDateTime');
                angular.forEach(data.Bookings, function(b) {
                    var date = new moment(b.BookedDateTime).startOf('day').format('DD/MM/YYYY');
                    var day = $scope.groups.filter(function(bd) {
                        return bd.title == date;
                    })[0];
                    if (day) {
                        day.bookings.push(b);
                    } else {
                        $scope.groups.push({
                            title: date,
                            bookings: [b]
                        })
                    }
                });
            }

            angular.forEach($scope.groups, function(day) {
                day.InvoiceCost = day.bookings.reduce(function(prev, next) {
                    return prev += next.InvoiceCost; }, 0);
                day.ExtrasCost = day.bookings.reduce(function(prev, next) {
                    return prev += next.ExtrasCost; }, 0);
                day.AdjustmentTotal = day.bookings.reduce(function(prev, next) {
                    return prev += next.AdjustmentTotal; }, 0);
                day.Discount = day.bookings.reduce(function(prev, next) {
                    return prev += next.Discount; }, 0);
                day.TaxAmount = day.bookings.reduce(function(prev, next) {
                    return prev += (next.InvoiceCost + next.AdjustmentTotal - next.Discount) * 0.2 }, 0);
                day.TotalAmount = day.InvoiceCost + day.AdjustmentTotal - day.Discount + day.TaxAmount + day.ExtrasCost;
            });

            function formatAddress(data) {
                var summary = '';
                summary += data.Address1 ? (data.Address1 + '\n') : '';
                summary += data.Address2 ? (data.Address2 + '\n') : '';
                summary += data.Area ? (data.Area + '\n') : '';
                summary += data.TownCity ? (data.TownCity + '\n') : '';
                summary += data.Postcode ? (data.Postcode + '\n') : '';
                summary += data.County ? (data.County + '\n') : '';
                summary += data.Country ? data.Country : '';
                return summary;
            }


            window.info = data;
            window.html2pdf = {
                header: {
                    height: "5.0cm",
                    contents: '' +
                        '<div id="invoice-pdf" style="border-bottom: 5px solid #ddd; background: #f9f9f9; padding:15px;">' +
                        '   <table id="company-information" style="width: 100%">' +
                        '       <tr><td style="width:60%; font-size: 14px; border:0;">' +
                        '           <table>' +
                        '               <tr><td style="width:35%; font-size: 11px; border:0;">' +
                        '                   <img src="' + $config.API_ENDPOINT + window.info.Company.LogoUrl + '" alt="" class="company-logo" />' +
                        '               </td>' +
                        '               <td style="width:65%; font-size: 12px; border:0;">' +
                        '                   <h4 class="brand-primary" style="margin-bottom: 5px; margin-top: 10px; font-size: 14px;">' + window.info.Company.Name + '</h4>' +
                        '                   <span>' + window.info.Company.Address1 + '</span>' +
                        '                   <span>' + window.info.Company.TownCity + '</span>' +
                        '                   <span>' + window.info.Company.Postcode + '</span>' +
                        '                   <br />' +
                        '                   <span>Phone: ' + window.info.Company.Phone + '</span>' +
                        '                   <br />' +
                        '                   <span>Email: ' + window.info.Company.Email + '</span>' +
                        '                   <br />' +
                        '                   <span>Wesbite: ' + window.info.Company.Website + '</span>' +
                        '               </td></tr>' +
                        '           </table>' +
                        '       </td>' +
                        '       <td style="width:40%; border:0;" align="right">' +
                        '           <h1 style="text-align:right;font-weight:400;margin-top:40px;float:right;color:#777;">INVOICE</h1>' +
                        '       </td></tr>' +
                        '   </table>' +
                        '<div>'
                },
                footer: {
                    height: "1.0cm",
                    contents: '{{pageNumber}} of {{totalPages}}'
                }
            };
        });
    }

})(window, angular);
