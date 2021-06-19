(function(angular) {
    var module = angular.module('cab9.bookings');

    module.controller('CCBookingsController', ccBookingsController);

    ccBookingsController.$inject = ['$scope', '$modal', 'Model', '$q', '$http', '$config', '$rootScope', '$compile', '$timeout','Notification'];

    function ccBookingsController($scope, $modal, Model, $q, $http, $config, $rootScope, $compile, $timeout, Notification) {

        $scope.bookings = [];
        $scope.selectedBookings = [];
        $scope.opened = {};
        $scope.fetchedClients = [];
        $scope.allBookingsSelected = false;
        $scope.bar = null;



        $scope.paging = {
            currentPage: 1,
            resultsPerPage: 100,
            totalResults: null,
            maxPages: null,
            loading: true,
            allBookingsSelected: false,
            collectingPayments: false
        };

        $scope.filters = {
            From: moment().subtract(1, "days").format("YYYY-MM-DD"),
            To: moment().format("YYYY-MM-DD"),
            DriverIds: [],
            ClientIds: [],
            PassengerIds: [],
            VehicleTypeIds: [],
            ClientStaffIds: [],
            PaymentMethods: ["1"],
            BookingSources: [],
            Top: 100,
            Skip: 0,
            MinCost: null,
            MaxCost: null,
            MinProfit: null,
            MaxProfit: null,
            SortBy: 'BookedDateTime',
            SearchTerm: null,
            ValidFilter: 'VAL',
            NoPaidInvoiced: false,
            CardPaymentStatus: [],
            NonDispute: true
        };


        $scope.fetchBookings = fetchBookings;
        $scope.openCalendar = openCalendar;
        $scope.searchClients = searchClients;
        $scope.toggleSelect = toggleSelect;
        $scope.takeAllPayments = takeAllPayments;
        $scope.expandBooking = expandBooking;
        $scope.expandTransaction = expandTransaction;
        $scope.clearFilters = clearFilters;
        $scope.emailTo = emailTo;

        $scope.cardPaymentStatuses = [];

        new Model.Booking().$$schema.CardPaymentStatus.enum.forEach(function(item, index) {
            $scope.cardPaymentStatuses.push({
                Id: index,
                Name: item
            });
        });

        fetchBookings(1);

        function fetchBookings(pageNum) {
            $scope.paging.loading = true;
            $scope.paging.currentPage = pageNum;
            $scope.filters.Skip = $scope.paging.resultsPerPage * ($scope.paging.currentPage - 1)

            var filterObj = angular.copy($scope.filters);
            var filterStrings = ["ClientIds", "PaymentMethods", "CardPaymentStatus"];

            filterStrings.map(function(fs) {
                if (filterObj[fs].length > 0) {
                    filterObj[fs].map(function(item, index) {
                        filterObj[fs][index] = _addQuotes(item);
                    });
                    filterObj[fs] = filterObj[fs].join(",");
                }
            });

            $http.get($config.API_ENDPOINT + 'api/bookings/validation/fetch', {
                params: filterObj
            }).success(function(data) {
                $scope.paging.loading = false;
                $scope.paging.totalResults = data.Stats.Bookings;
                $scope.paging.maxPages = Math.ceil($scope.paging.totalResults / $scope.paging.resultsPerPage);

                $scope.bookings = data.Bookings;
                $scope.stats = data.Stats;

            }).error(function(error) {
                $scope.paging.loading = false;
                swal("Error", error.Message, "error");
            });

        }

        function clearFilters() {
            $scope.filters = {
                From: moment().subtract(1, "days").format("YYYY-MM-DD"),
                To: moment().format("YYYY-MM-DD"),
                DriverIds: [],
                ClientIds: [],
                PassengerIds: [],
                VehicleTypeIds: [],
                ClientStaffIds: [],
                PaymentMethods: ["1"],
                BookingSources: [],
                Top: 100,
                Skip: 0,
                MinCost: null,
                MaxCost: null,
                MinProfit: null,
                MaxProfit: null,
                SortBy: 'BookedDateTime',
                SearchTerm: null,
                ValidFilter: 'NON',
                NoPaidInvoiced: false,
                CardPaymentStatus: []
            };
        }

        function expandBooking(booking) {
            booking.$Expanded = true;
            fetchFinanceTransaction(booking);
        }

        function fetchFinanceTransaction(booking) {
            $scope.fetchingFinance = true;
            $http.get($config.API_ENDPOINT + 'api/bookings/getbookingfinancedetails', {
                params: {
                    bookingId: booking.Id,
                }
            }).success(function(data) {
                booking.$FinanceInfo = data;
                $http.get($config.API_ENDPOINT + "api/Transactions/DetailedTransactions", {
                params: {
                    bookingId: booking.Id,
                }
            }).success(function(data) {
                booking.$Transactions = data;
                $scope.fetchingFinance = false;
            });
            });
        }

        function expandTransaction(item) {
            item.$expanded = true;
            item.Request = JSON.parse(item.Request);
            item.Response = JSON.parse(item.Response);
        }

        function toggleSelect() {
            if ($scope.paging.allBookingsSelected == true) {
                $scope.bookings.map(function(b) {
                    if (b.CardPaymentStatus != 'Pending' && b.CardPaymentStatus != 'Success') {
                        b.$Selected = true;
                    }
                });

            } else {
                $scope.bookings.map(function(b) {
                    b.$Selected = false;
                })
            }
        }

        function emailTo (type, booking) {
            var modalIns = $modal.open({
                templateUrl: '/webapp/common/modals/email-to.modal.html',
                controller: ['$scope', 'emailAddress', '$modalInstance', function($scope, emailAddress, $modalInstance) {
                    if (emailAddress != null)
                        $scope.email = emailAddress;

                    $scope.sendEmail = function() {
                        $modalInstance.close($scope.email);
                    }
                }],
                resolve: {
                    emailAddress: function() {
                        var email = null;
                        switch (type) {
                            case "RECEIPT":
                                email = booking.LeadPassengerEmail ? booking.LeadPassengerEmail : null;
                                break;
                            default:
                                break;
                        }
                        return email;
                    }
                }
            });

            modalIns.result.then(function(res) {
                if (res != null) {
                    if (type == "RECEIPT") {
                        $http.post($config.API_ENDPOINT + 'api/email', {
                            Type: "PassengerBookingPaymentReceipt",
                            BookingId: booking.Id,
                            EmailId: res
                        }).success(function() {
                            Notification.success('Email Sent');
                        })
                    }
                }
            });

        }

        function searchClients(searchText) {
            $scope.fetchedClients.length = 0;
            if (searchText)
                Model.Client
                .query()
                .where("substringof('" + searchText + "', Name) or substringof('" + searchText + "', AccountNo)")
                .select('Id,AccountNo,Name, ClientType/Name')
                .include('ClientType')
                .parseAs(function(item) {
                    this.Id = item.Id;
                    this.Name = '(' + item.AccountNo + ') ' + item.Name;
                    this.Description = (item.ClientType && item.ClientType.Name);
                    this.AccountNo = item.AccountNo;
                })
                .top(10)
                .execute().then(function(data) {
                    [].push.apply($scope.fetchedClients, data);
                });
        }


        function takeAllPayments() {
            var checkedBookings = $scope.bookings.filter(function(b) {
                return b.$Selected == true;
            });
            if (checkedBookings.length > 0) {
                $scope.paging.collectingPayments = true;
                $scope.bar = {
                    Total: 0,
                    Success: 0,
                    Failure: 0
                };
                var previous = $q.when();
                for (i = 0; i < checkedBookings.length; i++) {
                    var booking = checkedBookings[i];
                    $scope.bar.Total += 1;
                    previous = previous.then(function() {
                        console.log("Collecting Payment for " + this.LocalId);
                        return takePaymentForBooking(this);
                    }.bind(booking));
                }
                $scope.paging.collectingPayments = false;
            } else {
                swal("No Bookings", "Please select at least one booking", "warning");
            }
        }

        function takePaymentForBooking(booking) {
            booking.CardPaymentStatus = 'Pending';
            return $http({
                method: 'POST',
                url: $config.API_ENDPOINT + 'api/Bookings/TakePayment?bookingId=' + booking.Id
            }).then(function successCallback(response) {
                console.log("Payment Succeeded for " + booking.LocalId);
                booking.CardPaymentStatus = 'Success';
                booking.$Selected = false;
                $scope.bar.Success += 1;
                return $q.when();
            }, function errorCallback(response) {
                console.error("Payment Failed for " + booking.LocalId);
                booking.CardPaymentStatus = 'Failure';
                booking.$Selected = false;
                $scope.bar.Failure += 1;
                return $q.when();
            });

        }

        function openCalendar(event, name) {
            $scope.opened[name] = true;
            event.preventDefault();
            event.stopPropagation();
        }

        function _addQuotes(str) {
            return "'" + str + "'";
        }


    }
})(angular);