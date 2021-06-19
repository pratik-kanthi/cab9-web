(function () {
    var module = angular.module('cab9.bookings');

    module.controller('BookingDestinationStopModal', bookingDestinationStopModal);
    module.directive('bookingStrip', function () {
        return {
            restrict: 'E',
            templateUrl: '/webapp/management/bookings/booking-strip.template.html',
            scope: {
                booking: '=',
                drivers: '=',
                vehicles: '=',
                onCompleted: '&',
            },
            controller: bookingStripController,
            link: function (scope, element, attrs) {
                scope.$expanded = false;
            },
        };
    });

    bookingStripController.$inject = ['$scope', 'Auth', '$modal', '$UI', '$config', '$http', 'Model', 'Localisation', '$permissions', 'Notification'];

    function bookingStripController($scope, Auth, $modal, $UI, $config, $http, Model, Localisation, $permissions, Notification) {
        $scope.BS = ['Completed', 'Cancelled', 'COA'];

        $scope.CARD_PAYMENTS_ENABLED = $config.CARD_PAYMENTS_ENABLED;
        $scope.paymentParams = {
            showCardPayment: false,
        };

        $scope.converToCardParams = {
            showCards: false,
            paymentCardId: null,
        };

        $scope.tab = {
            current: 'Info',
        };

        $scope.exportReceipt = exportReceipt;

        $scope.history = {};
        $scope.noHistory = false;
        $scope.noMoreHistory = false;
        $scope.historyPage = 1;
        $scope.fetchMoreHistory = fetchMoreHistory;
        $scope.expandTransaction = expandTransaction;
        $scope.takeCardPayment = takeCardPayment;
        $scope.recalculateBooking = recalculateBooking;
        $scope.updateBookingPaymentType = updateBookingPaymentType;

        $scope.iconsIndex = {
            'N/A': 'assignment',
            'Booking Offer Sent': 'assignment',
            'Booking Created': 'assignment',
            'Booking Cancelled': 'assignment',
            'Infinity Cancelled': 'assignment',
            'OT Cancelled': 'assignment',
            FlightTrackingStarted: 'flight_land',
            FlightTrackingStopped: 'flight_land',
            'SMS Confirmation': 'insert_comment',
            'Email Client Confirmation': 'email',
            'Email Booker Confirmation': 'email',
            'SMS Driver Arrived': 'insert_comment',
            'Call Driver Arrived': 'phone',
            'Email Manual Confirmation': 'email',
            'Driver Read Offer': 'person_pin',
            'Driver Accepted': 'person_pin',
            'Driver Rejected': 'person_pin',
            'Driver Allocated': 'person_pin',
            'Driver Unallocated': 'person_pin',
            'Booking Offered To Driver': 'person_pin',
            'Booking Pre Allocated To Driver': 'person_pin',
            'Booking Patched': 'assignment',
            'Booking Edited': 'assignment',
            DriverUpdate: 'person_pin',
            DriverPaymentIssued: 'account_balance_wallet',
            DriverPaymentGenerated: 'account_balance_wallet',
            DriverPaymentCancelled: 'account_balance_wallet',
            ClientInvoiceIssued: 'check_circle',
            ClientInvoiceCancelled: 'check_circle',
            'Flight Update': 'flight_land',
            Repricing: 'border_color',
            'Booking Sent to Bidding Portal': 'assignment',
            'Booking Removed from Bidding Portal': 'assignment',
            'Driver Bidded for Booking': 'person_pin',
        };

        $scope.coloursIndex = {
            'N/A': 'orange-bg',
            'Booking Offer Sent': 'green-bg',
            'Booking Created': 'green-bg',
            FlightTrackingStarted: 'green-bg',
            FlightTrackingStopped: 'red-bg',
            'SMS Confirmation': 'green-bg',
            'Email Client Confirmation': 'green-bg',
            'Email Booker Confirmation': 'green-bg',
            'SMS Driver Arrived': 'green-bg',
            'Call Driver Arrived': 'green-bg',
            'Email Manual Confirmation': 'orange-bg',
            'Driver Read Offer': 'green-bg',
            DriverUpdate: 'green-bg',
            'Driver Accepted': 'green-bg',
            'Driver Rejected': 'orange-bg',
            'Driver Allocated': 'green-bg',
            'Driver Unallocated': 'green-bg',
            'Booking Offered To Driver': 'green-bg',
            'Booking Pre Allocated To Driver': 'green-bg',
            'Booking Patched': 'orange-bg',
            'Booking Edited': 'orange-bg',
            DriverPaymentIssued: 'green-bg',
            DriverPaymentGenerated: 'green-bg',
            DriverPaymentCancelled: 'red-bg',
            ClientInvoiceIssued: 'green-bg',
            ClientInvoiceCancelled: 'red-bg',
            'Booking Cancelled': 'red-bg',
            'Infinity Cancelled': 'red-bg',
            'OT Cancelled': 'red-bg',
            'Flight Update': 'orange-bg',
            Repricing: 'orange-bg',
            'Booking Sent to Bidding Portal': 'green-bg',
            'Booking Removed from Bidding Portal': 'green-bg',
            'Driver Bidded for Booking': 'green-bg',
        };

        $scope.PERMISSIONS = $permissions;
        var current = Localisation.currency().getCurrent();

        if ($scope.booking.Client) {
            $scope.CurrencyId = $scope.booking.Client.DefaultCurrencyId;
        } else $scope.CurrencyId = current.Id;

        $scope.assignDriver = function (booking, driver) {
            booking.DriverId = driver.Id;
            booking.VehicleId = driver.DefaultVehicleId;
            booking.$patch(true).then(function () {
                booking.$commit(true);
            });
        };

        $scope.closeBooking = closeBooking;
        $scope.expandBooking = expandBooking;

        $scope.trackBooking = function (booking) {
            $http({
                method: 'GET',
                url: window.endpoint + 'api/bookingcodes?bookingid=' + booking.Id,
            }).then(
                function successCallback(response) {
                    if (response.data && response.data.Code) {
                        window.open('/track/' + response.data.Code, '_blank', 'height=870,width=1000,left=0,top=0');
                    } else {
                        swal({
                            title: 'Tracking Not Available.',
                            text: 'The tracking information for this booking is not yet available.',
                            type: 'warning',
                            confirmButtonColor: $UI.COLOURS.brandSecondary,
                        });
                    }
                },
                function errorCallback(response) {}
            );
        };

        $scope.getTaxAmount = function (booking) {
            if (booking.Tax && booking.Tax.TaxComponents)
                return booking.Tax.TaxComponents.reduce(function (prev, current) {
                    return prev + current.Rate / 100;
                }, 0);
        };

        $scope.loading = false;

        function recalculateBooking(booking) {
            $scope.fetchingFinance = true;
            $http
                .put($config.API_ENDPOINT + 'api/bookings/recalculate?bookingId=' + booking.Id)
                .success(function (data) {
                    fetchFinanceTransaction(booking);
                })
                .error(function (error) {
                    swal('Error', error.Message, 'error');
                    $scope.fetchingFinance = false;
                });
        }

        function updateBookingPaymentType(bookingId, paymentType) {
            swal(
                {
                    title: 'Are you sure?',
                    text: 'This will convert the booking payment method as ' + paymentType,
                    type: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Confirm',
                },
                function () {
                    $http
                        .post($config.API_ENDPOINT + 'api/bookings/update-paymentType?bookingId=' + bookingId + '&paymentType=' + paymentType + '&paymentCardId=' + $scope.converToCardParams.paymentCardId)
                        .success(function (data) {
                            swal(
                                {
                                    title: 'Payment Type Updated',
                                    text: 'Payment Type has been successfully updated to ' + paymentType,
                                    type: 'success',
                                    confirmButtonColor: $UI.COLOURS.brandSecondary,
                                },
                                function () {}
                            );
                        })
                        .error(function (error) {
                            swal('Error', error.ExceptionMessage, 'error');
                        });
                }
            );

            $;
        }

        $scope.$watch('booking.$expanded', function (newvalue) {
            if ($scope.booking.$expanded) {
                $scope.loading = true;
                Model.Booking.query()
                    .select('Id,AdjustmentTotal,BookingExpense/Amount,BookingExpense/BookingExpenseType/Name,BookingValidations/Value,BookingValidations/ClientReference/ReferenceName,BookingRequirements/Name,Invoice/Id,Invoice/Reference,DriverPayment/Id,DriverPayment/Reference,EncodedRoute,ActualRoute,Tax,Tax/TaxComponents,BookingTags/Type,BookingTags/Tag/Name')
                    .include('BookingExpense,BookingExpense/BookingExpenseType,BookingValidations,BookingValidations/ClientReference,BookingRequirements,Invoice,DriverPayment,Tax,Tax/TaxComponents,BookingTags,BookingTags/Tag')
                    .filter("Id eq guid'" + $scope.booking.Id + "'")
                    .execute()
                    .then(
                        function (response) {
                            $scope.booking.$WaitTime = 0;
                            $scope.booking.AdjustmentTotal = response[0].AdjustmentTotal;
                            $scope.booking.BookingValidations = response[0].BookingValidations;
                            $scope.booking.BookingTags = response[0].BookingTags;
                            $scope.booking.BookingExpense = response[0].BookingExpense;
                            $scope.booking.BookingRequirements = response[0].BookingRequirements;
                            $scope.booking.Invoice = response[0].Invoice;
                            $scope.booking.DriverPayment = response[0].DriverPayment;
                            $scope.booking.BookingStops.map(function (item) {
                                $scope.booking.$WaitTime += item.WaitTime;
                            });
                            $scope.booking.Tax = response[0].Tax;
                            $scope.loading = false;
                        },
                        function (err) {
                            swal({
                                title: 'Some Error Occured.',
                                text: 'Some error has occured.',
                                type: 'error',
                                confirmButtonColor: $UI.COLOURS.brandSecondary,
                            });
                        }
                    );

               
                $http.post($config.API_ENDPOINT + 'api/quote', $scope.booking).success(function (result) {
                    $scope.booking.quote = result;
                    
                });


                $http.get('http://localhost:8081/v1.1/api/passenger/loyalty-transaction?localId=' + $scope.booking.LocalId ).success(function (result) {
                   
                    result.Points = parseFloat(result.Points);
                    $scope.booking.loyaltyTransaction = result;
                    
                    if(result.Points > 0){
                        $scope.booking.loyaltyTransaction.PointsGained = result.Points
                    }else{
                        $scope.booking.loyaltyTransaction.PointsUsed = result.Points
                    }
                });

                
            }
        });

        function exportReceipt() {
            //var token = Auth.getSession().access_token;
            //window.open($config.API_ENDPOINT + "Exports/BookingReceipt/template.html#/?bookingid=" + $scope.booking.Id);
            //return;
            var receiptUrl = window.encodeURIComponent($config.API_ENDPOINT + 'Exports/BookingReceipt/template.html#/?bookingid=' + $scope.booking.Id);
            window.open('http://h2p.utilities.e9ine.com/?url=' + receiptUrl + '&filename=' + $scope.booking.LocalId, '_blank');
        }

        $scope.updateBookingStatus = function updateBookingStatus(b, status) {
            var booking = new Model.Booking(b);
            var _warText = '';
            b.$updating = true;
            if (b.DriverPaymentId || b.InvoiceId) {
                swal('Warning', 'Booking status cannot be modified as the booking is Invoiced/Driver Paid', 'warning');
                b.$updating = false;
                return;
            }
            if (status == 'Completed' && !b.DriverId) {
                swal('Complete Warning', 'Booking cannot be completed as there is no driver attached to it.', 'warning');
                b.$updating = false;
                return;
            }
            if (status == 'Cancelled') {
                _warText = 'The Booking will be cancelled and not billed to client.';
            } else if (status == 'COA') {
                _warText = 'The Booking will be marked COA and client may be billed a minimum amount.';
            } else if ((status = 'Completed')) {
                _warText = 'The Booking will be marked completed.';
            }
            swal(
                {
                    title: 'Are you sure?',
                    text: _warText,
                    type: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Confirm',
                },
                function () {
                    booking.BookingStatus = status;
                    booking.$patch(true).then(function () {
                        b.$updating = false;
                        booking.$commit(true);
                    });
                }
            );
        };

        $scope.assignVehicle = function (booking, vehicle) {
            booking.$driverUpdate = true;
            booking.VehicleId = vehicle.Id;
            booking.$patch(true).then(function () {
                booking.Vehicle = vehicle;
                booking.$commit(true);
                booking.$driverUpdate = false;
            });
        };

        $scope.removeDriver = function (booking) {
            booking.$driverUpdate = true;
            booking.DriverId = null;
            booking.VehicleId = null;
            booking.$patch(true).then(function () {
                booking.Driver = null;
                booking.$commit(true);
                booking.$driverUpdate = false;
            });
        };

        $scope.removeVehicle = function (booking) {
            booking.VehicleId = null;
            booking.$patch(true).then(function () {
                booking.Vehicle = null;
                booking.$commit(true);
            });
        };

        $scope.toggleComplete = function (booking, $event) {
            if (booking.BookingStatus == 'Completed') {
                booking.BookingStatus = 'Allocated';
                $($event.target).removeClass('animated tada');
            } else {
                booking.BookingStatus = 'Completed';
                $($event.target).addClass('animated tada');
            }
            booking.$patch(true).then(function () {
                Notification.success('Booking Saved');
                setTimeout(function () {
                    $scope.onCompleted();
                    // $state.go('root.bookings', null, { reload: true });
                }, 1000);
            });
        };

        $scope.getLocation = function (booking) {
            var waypts = [];

            var directionsService = new google.maps.DirectionsService();
            var request = {
                origin: booking._FromSummary,
                destination: booking._ToSummary,
                waypoints: waypts,
                optimizeWaypoints: true,
                travelMode: google.maps.TravelMode.DRIVING,
            };

            directionsService.route(request, function (res, status) {
                if (status == google.maps.DirectionsStatus.OK) {
                    staticMapUrl = encodeURI($config.GMAPS_STATIC_URL + '&markers=shadow:false|scale:2|icon:http://d1a3f4spazzrp4.cloudfront.net/receipt-new/marker-start@2x.png|' + booking._FromSummary + '&markers=shadow:false|scale:2|icon:http://d1a3f4spazzrp4.cloudfront.net/receipt-new/marker-finish@2x.png|' + booking._ToSummary + '&path=weight:5|color:0x2dbae4ff|enc:' + res.routes[0].overview_polyline);
                    $scope.booking.mapUrl = staticMapUrl;
                }
                $scope.$apply();
            });
        };

        $scope.openEditModal = function (booking, repeat) {
            if (repeat) {
                window.open('/webapp/common/modals/bookings/reuse-booking/window.html#?id=' + booking.Id + '&clientId=' + booking.ClientId + '&repeat=true', '_blank', 'height=870,width=1000,left=0,top=0');
            } else {
                window.open('/webapp/common/modals/bookings/edit-booking/window.html#?id=' + booking.Id + '&clientId=' + booking.ClientId, 'EDIT:' + booking.Id, 'height=870,width=1000,left=0,top=0');
            }
        };

        $scope.reUse = function (booking) {
            window.open('/webapp/common/modals/bookings/reuse-booking/window.html#?id=' + booking.Id + '&clientId=' + booking.ClientId, '_blank', 'height=870,width=1000,left=0,top=0');
        };

        $scope.textTo = function (type, booking) {
            var modalIns = $modal.open({
                templateUrl: '/webapp/common/modals/text-to.modal.html',
                controller: [
                    '$scope',
                    'emailAddress',
                    '$modalInstance',
                    function ($scope, emailAddress, $modalInstance) {
                        if (emailAddress != null) $scope.email = emailAddress;

                        $scope.sendEmail = function () {
                            $modalInstance.close($scope.email);
                        };
                    },
                ],
                resolve: {
                    emailAddress: function () {
                        return booking.PassengerNotificationPhone;
                    },
                },
            });

            modalIns.result.then(function (res) {
                if (res != null) {
                    swal('Success', 'User will receive the SMS soon..', 'success');
                    $http
                        .post($config.API_ENDPOINT + 'api/email', {
                            Type: 'SMSConfirmation',
                            BookingId: booking.Id,
                            EmailId: res,
                        })
                        .success(function () {
                            Notification.success('SMS Sent');
                        });
                }
            });
        };

        $scope.emailTo = function (type, booking) {
            var modalIns = $modal.open({
                templateUrl: '/webapp/common/modals/email-to.modal.html',
                controller: [
                    '$scope',
                    'emailAddress',
                    '$modalInstance',
                    function ($scope, emailAddress, $modalInstance) {
                        if (emailAddress != null) $scope.email = emailAddress;

                        $scope.sendEmail = function () {
                            $modalInstance.close($scope.email);
                        };
                    },
                ],
                resolve: {
                    emailAddress: function () {
                        var email = null;
                        switch (type) {
                            case 'DRIVER':
                                email = booking.Driver ? booking.Driver.Email : null;
                                break;
                            case 'PAX':
                                email = booking.LeadPassenger ? booking.LeadPassenger.Email : null;
                                break;
                            case 'CLIENT':
                                email = booking.Client ? booking.Client.Email : null;
                                break;
                            case 'RECEIPT':
                                email = booking.LeadPassenger ? booking.LeadPassenger.Email : null;
                                break;
                            default:
                                break;
                        }
                        return email;
                    },
                },
            });

            modalIns.result.then(function (res) {
                if (res != null) {
                    swal('Success', 'User will receive the email soon..', 'success');
                    if (type == 'DRIVER') {
                        $http
                            .post($config.API_ENDPOINT + 'api/email', {
                                Type: 'DriverConfirmation',
                                BookingId: booking.Id,
                                DriverId: booking.DriverId,
                                EmailId: res,
                            })
                            .success(function () {
                                Notification.success('Email Sent');
                            });
                    } else if (type == 'PAX') {
                        $http
                            .post($config.API_ENDPOINT + 'api/email', {
                                Type: 'PassengerConfirmation',
                                BookingId: booking.Id,
                                PassengerId: booking.LeadPassengerId,
                                EmailId: res,
                            })
                            .success(function () {
                                Notification.success('Email Sent');
                            });
                    } else if (type == 'CLIENT') {
                        $http.get(
                            $config.API_ENDPOINT + 'api/email/booking',
                            {
                                params: {
                                    bookingId: booking.Id,
                                    email: res,
                                },
                            },
                            function () {
                                Notification.success('Email Sent');
                                console.log('Email Sent');
                            }
                        );
                    } else if (type == 'PAYMENT') {
                        $http.get(
                            $config.API_ENDPOINT + 'api/email/payment-link',
                            {
                                params: {
                                    bookingId: booking.Id,
                                    email: res,
                                },
                            },
                            function () {
                                Notification.success('Email Sent');
                            }
                        );
                    } else if (type == 'RECEIPT') {
                        $http
                            .post($config.API_ENDPOINT + 'api/email', {
                                Type: 'PassengerBookingPaymentReceipt',
                                BookingId: booking.Id,
                                EmailId: res,
                            })
                            .success(function () {
                                Notification.success('Email Sent');
                            });
                    }
                }
            });
        };

        var partEditingTemplate = {
            toggle: false,
            cancel: function standardCancel() {
                $scope.booking.$rollback();
                this.toggle = false;
            },
            save: function standardSave() {
                $scope.booking.$patch();
                this.toggle = false;
            },
        };
        $scope.API_ENDPOINT = $config.API_ENDPOINT;
        var stopEdit = {
            toggle: false,
            editDestination: function (d, a) {
                this.toggle = true;
                var modalInstance = $modal.open({
                    templateUrl: '/webapp/management/bookings/stop-edit.modal.html',
                    controller: 'BookingDestinationStopModal',
                    resolve: {
                        dropOffLoc: function () {
                            if (d) return $scope.booking._ToSummary;
                        },
                    },
                });

                modalInstance.result.finally(function () {
                    stopEdit.toggle = false;
                });

                modalInstance.result.then(function (result) {
                    if (d) {
                        var index = $scope.booking.BookingStops.length - 1;
                        var removed = $scope.booking.BookingStops.splice(index, 1, result);
                        result.Id = removed[0].Id;
                        result.BookingId = $scope.booking.Id;
                        $http({
                            method: 'PATCH',
                            url: $config.API_ENDPOINT + 'api/BookingStops?id=' + result.Id,
                            data: result,
                        });
                    } else {
                        result.Type = 'Via';
                        var index = $scope.booking.BookingStops.length - 1;
                        $scope.booking.BookingStops.splice(index, 0, result);
                        result.BookingId = $scope.booking.Id;
                        $http.post($config.API_ENDPOINT + 'api/BookingStops', result);
                    }
                });
            },
        };

        $scope.stopSummary = function (stop) {
            return stop.Address1 + ' ' + stop.Area + ', ' + stop.TownCity + ', ' + stop.Postcode;
        };

        $scope.editing = {
            any: function () {
                return this.expenses.toggle || this.waiting.toggle || this.notes.toggle || this.stops.toggle;
            },
            expenses: angular.copy(partEditingTemplate),
            waiting: angular.copy(partEditingTemplate),
            notes: angular.copy(partEditingTemplate),
            stops: stopEdit,
        };

        $scope.showConversations = showConversations;

        function showConversations(booking, type) {
            var modalInstance = $modal.open({
                templateUrl: '/webapp/common/views/conversations/conversations-list.partial.html',
                controller: 'ConversationsModalController',
                windowClass: 'chat',
                backdropClass: 'chatBG',
                resolve: {
                    rBooking: function () {
                        return booking;
                    },
                    rType: function () {
                        return type;
                    },
                },
            });
        }

        function expandBooking(booking) {
            booking.$expanded = true;

            var stops = [];
            stops.push("(EntityType eq 'Booking' and EntityId eq guid'" + booking.Id + "')");
            stops.push("(BookingId eq guid'" + booking.Id + "')");
            for (var i = 0; i < booking.BookingStops.length; i++) {
                var s = booking.BookingStops[i];
                stops.push("(EntityType eq 'BookingStop' and EntityId eq guid'" + s.Id + "')");
            }

            fetchHistoryPage(1, booking);
            fetchFinanceTransaction($scope.booking);

            fetchTelephonyCalls($scope.booking);

            if ($config.CARD_PAYMENTS_ENABLED) {
                fetchBookingCards();
            }
        }

        function expandTransaction(item) {
            item.$expanded = true;
            item.Request = JSON.parse(item.Request);
            item.Response = JSON.parse(item.Response);
        }

        function fetchFinanceTransaction(booking) {
            $scope.fetchingFinance = true;
            $http
                .get($config.API_ENDPOINT + 'api/bookings/getbookingfinancedetails', {
                    params: {
                        bookingId: booking.Id,
                    },
                })
                .success(function (data) {
                    booking.$FinanceInfo = data;
                    if (booking.PaymentMethod == 'Card') {
                        $http
                            .get($config.API_ENDPOINT + 'api/Transactions/DetailedTransactions', {
                                params: {
                                    bookingId: booking.Id,
                                },
                            })
                            .success(function (data) {
                                booking.$Transactions = data;
                                if ($config.CARD_PAYMENTS_ENABLED) {
                                    fetchBookingCards();
                                } else {
                                    $scope.fetchingFinance = false;
                                }
                            });
                    } else {
                        $scope.fetchingFinance = false;
                    }
                });
        }

        function fetchTelephonyCalls(booking) {
            $scope.fetchingCalls = true;
            $http
                .get($config.API_ENDPOINT + 'api/calls/for-bookings', {
                    params: {
                        bookingId: booking.Id,
                    },
                })
                .success(function (data) {
                    booking.$Calls = data;
                    booking.$Calls.map(function (call) {
                        call.$StartTime = moment(call.StartTime);
                        call.$AnsweredTime = moment(call.AnsweredTime);
                        call.$EndTime = moment(call.EndTime);
                        call.$RingingDuration = call.$AnsweredTime.diff(call.$StartTime, 'seconds');
                        call.$CallDuration = call.$EndTime.diff(call.$AnsweredTime, 'seconds');
                    });
                    $scope.fetchingCalls = false;
                });
        }

        function fetchBookingCards() {
            Model.PaymentCard.query()
                .where("PassengerId eq guid'" + $scope.booking.LeadPassengerId + "'")
                .where('Active eq true')
                .execute()
                .then(function (data) {
                    $scope.fetchingFinance = false;
                    $scope.passengerCards = data;

                    if ($scope.booking.ClientId != null) {
                        Model.PaymentCard.query()
                            .where("ClientId eq guid'" + $scope.booking.ClientId + "'")
                            .where('Active eq true')
                            .execute()
                            .then(function (data) {
                                $scope.clientCards = data;
                            });
                    }
                });
        }

        function takeCardPayment() {
            $scope.paymentParams.collectingPayment = true;
            if ($scope.paymentParams.PaymentCardId) {
                $http({
                    method: 'POST',
                    url: $config.API_ENDPOINT + 'api/Bookings/TakePayment?bookingId=' + $scope.booking.Id + '&paymentCardId=' + $scope.paymentParams.PaymentCardId,
                }).then(
                    function successCallback(response) {
                        swal('Payment Successful', 'Payment has been taken successfully using the selected card.', 'success');
                        fetchFinanceTransaction($scope.booking);
                        $scope.booking.CardPaymentStatus = 'Success';
                        $scope.booking.PaymentMethod = 'Card';
                        $scope.paymentParams.collectingPayment = false;
                        $scope.paymentParams = {
                            showCardPayment: false,
                        };
                    },
                    function errorCallback(response) {
                        fetchFinanceTransaction($scope.booking);
                        $scope.booking.CardPaymentStatus = 'Failure';
                        swal('Payment Error', 'An error occurred while collecting payment. ' + response.data.Message, 'error');
                        $scope.paymentParams.collectingPayment = false;
                        $scope.paymentParams = {
                            showCardPayment: false,
                        };
                    }
                );
            } else {
                swal('Payment Error', 'Please make sure that a card is selected and payment amount is more than £0.00.', 'error');
                $scope.paymentParams.collectingPayment = false;
                $scope.paymentParams = {
                    showCardPayment: false,
                };
            }
        }

        function fetchHistoryPage(page, booking) {
            var top = 10;
            var skip = (page - 1) * top;
            $http
                .get($config.API_ENDPOINT + 'api/Audit/ForBooking', {
                    params: {
                        bookingId: booking.Id,
                        top: top,
                        skip: skip,
                    },
                })
                .success(function (data) {
                    if (page == 1 && data.length == 0) {
                        $scope.noHistory = true;
                    }
                    if (data.length < top || data[data.length - 1].BookingEvent == 'Booking Created') {
                        $scope.noMoreHistory = true;
                    }
                    angular.forEach(data, function (x) {
                        var date = moment(x.Timestamp).format('DD MMM');
                        if (!$scope.history[date]) {
                            $scope.history[date] = [];
                        }
                        $scope.history[date].push(new Model.AuditRecord(x));
                    });
                });
        }

        function fetchMoreHistory(booking) {
            $scope.historyPage++;
            fetchHistoryPage($scope.historyPage, booking);
        }

        function closeBooking(booking) {
            booking.$expanded = false;
            $scope.noHistory = false;
            $scope.noMoreHistory = false;
            $scope.historyPage = 1;
            if ($scope.history) {
                $scope.history = {};
            }
        }
    }

    bookingDestinationStopModal.$inject = ['$scope', '$modalInstance', 'dropOffLoc'];

    function bookingDestinationStopModal($scope, $modalInstance, dropOffLoc) {
        if (dropOffLoc) {
            var geocoder = new google.maps.Geocoder();
            geocoder.geocode(
                {
                    address: dropOffLoc,
                },
                function (results, status) {
                    $scope.choosen = results[0];
                }
            );
        } else $scope.choosen = null;

        $scope.destinationValid = false;

        $scope.map = {
            center: {
                latitude: 45,
                longitude: -73,
            },
            zoom: 17,
        };

        $scope.markers = [];

        $scope.$watch('choosen', function (newvalue) {
            if (newvalue && angular.isObject(newvalue) && newvalue.geometry) {
                $scope.destinationValid = true;
                $scope.map.center = {
                    latitude: newvalue.geometry.location.lat(),
                    longitude: newvalue.geometry.location.lng(),
                };
                $scope.markers = [
                    {
                        id: '5WnUJbhPEg',
                        coords: {
                            latitude: newvalue.geometry.location.lat(),
                            longitude: newvalue.geometry.location.lng(),
                        },
                    },
                ];
            } else {
                $scope.destinationValid = false;
            }
        });

        $scope.confirmDestination = function () {
            var newLoc = {};
            angular.forEach($scope.choosen.address_components, function (comp) {
                var type = comp.types[0];
                switch (type) {
                    case 'street_number':
                        newLoc.Address2 = comp.long_name;
                        break;
                    case 'route':
                        newLoc.Address1 = comp.long_name;
                        break;
                    case 'locality':
                        newLoc.Area = comp.long_name;
                        break;
                    case 'postal_town':
                        newLoc.TownCity = comp.long_name;
                        break;
                    case 'administrative_area_level_2':
                        newLoc.County = comp.long_name;
                        break;
                    case 'postal_code':
                        newLoc.Postcode = comp.long_name;
                        break;
                    default:
                }
            });
            if (
                $scope.choosen.types.filter(function (t) {
                    return t === 'airport' || t === 'transit_station';
                }).length
            ) {
                newLoc.Alias = $scope.choosen.name;
            } else {
                newLoc.Alias = $scope.choosen.formatted_address;
            }
            try {
                newLoc.Latitude = $scope.choosen.geometry.lat();
                newLoc.Longitude = $scope.choosen.geometry.lng();
            } catch (e) {}

            $modalInstance.close(newLoc);
        };
    }
})();
