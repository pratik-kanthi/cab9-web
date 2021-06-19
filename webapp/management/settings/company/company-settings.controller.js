(function(angular) {
    var module = angular.module('cab9.settings');
    module.controller('SettingsCompanyController', SettingsCompanyController);

    module.controller('SettingsCompanyBasicController', SettingsCompanyBasicController);
    module.controller('SettingsCompanyInvoicingController', SettingsCompanyInvoicingController);
    module.controller('SettingsCompanyLocalisationController', SettingsCompanyLocalisationController);
    module.controller('SettingsCompanyCreditCardsController', SettingsCompanyCreditCardsController);
    module.controller('SettingsCompanyDispatchController', SettingsCompanyDispatchController);
    module.controller('SettingsMobileAppController', SettingsMobileAppController);
    module.controller('SettingsWebBookerController', SettingsWebBookerController);
    module.controller('SettingsFTPDetailsController', SettingsFTPDetailsController);

    SettingsMobileAppController.$inject = ['$scope', '$config', '$http', '$q', 'Auth', 'Model'];

    function SettingsMobileAppController($scope, $config, $http, $q, Auth, Model) {
        $scope.state = {
            editing: false,
            validApn: false
        }
        $scope.customerstate = {
            editing: false,
            validApn: false
        }
        $scope.notificationTemplates = null;
        $scope.displayMode = 'VIEW';
        $scope.startEditing = startEditing;
        $scope.cancelEditing = cancelEditing;
        $scope.saveEdits = saveEdits;

        var importing = false;
        var customerimporting = false;
        $scope.import = {
            file: null,
            password: null
        };
        $scope.Customerappimport = {
            file: null,
            password: null
        };

        $http.get($config.API_ENDPOINT + 'api/ApnDetail').success(function(data) {
            if (data != null || data != undefined) {
                for (i = 0; i < data.length; i++) {
                    if (data[i].DeviceType == 'Driver')
                        $scope.state.validApn = !!data;
                    else if (data[i].DeviceType == 'Passenger')
                        $scope.customerstate.validApn = !!data;
                }
            }
        });

        Model.NotificationTemplates.query().execute().then(function(data) {
            if (data[0]) {
                $scope.notificationTemplates = new Model.NotificationTemplates(data[0]);
            } else {
                $scope.notificationTemplates = new Model.NotificationTemplates({
                    NewBookingOfferTitle: "New Booking Offer",
                    NewBookingOfferText: "You have a new booking offer, return to app to accept",
                    ShiftTimeoutAlertTitle: "Location Required",
                    ShiftTimeoutAlertText: "We need your location to keep you online, please return to the Driver App.",
                    ShiftTimeoutFinalAlertTitle: "Location Required - Final Warning",
                    ShiftTimeoutFinalAlertText: "You are about to be made offline, please return to the Driver App to stay online.",
                    ShiftClosedAlertTitle: "Shift Closed",
                    ShiftClosedAlertText: "We have not received a location in over an hour and your shift has been closed.",
                    NewBookingTitle: "New Booking",
                    NewBookingText: "You have been assigned a new booking, return to app to view",
                    BookingChangedTitle: "Booking Modified",
                    BookingChangedText: "Your Booking has been updated",
                    BookingUnallocatedTitle: "Booking Unallocated",
                    BookingUnallocatedText: "You have been unassigned from a booking",
                    BookingOnRouteTitle: "Enroute",
                    BookingOnRouteText: "Your driver is On Route to your location.",
                    BookingCancelledTitle: "Cancelled",
                    BookingCancelledText: "Sorry! Your booking has been cancelled.",
                    BookingArrivedTitle: "Arrived",
                    BookingArrivedText: "Your driver has arrived at the location.",
                    BookingInProgressTitle: "In Progress",
                    BookingInProgressText: "We have started your journey! have a great experience.",
                    BookingCOATitle: "Cancelled On Arrival",
                    BookingCOAText: "Sorry! Your booking has been cancelled after driver arrived at the location.",
                    BookingCompletedTitle: "Completed",
                    BookingCompletedText: "Booking completed. Thank you for choosing us! have a great day",
                    BookingAllocatedForPassengerTitle: "Booking Allocated",
                    BookingAllocatedForPassengerText: "Driver has been assigned to your booking.",
                    BookingUnallocatedForPassengerTitle: "Booking Unallocated",
                    BookingUnallocatedForPassengerText: "Driver has been removed from your booking, we will shortly assign a new driver.",
                    BookingNextStopForPassengerTitle: "En Route to Next stop",
                    BookingNextStopForPassengerText: "Driver is on route to next stop."
                });
            }
        }, function(error) {

        });

        $scope.save = function(isPassengerCertificate) {
            if (isPassengerCertificate) {
                if (!$scope.Customerappimport.file || customerimporting) {
                    return;
                }
                if (!$scope.Customerappimport.file.name.endsWith(".p12")) {
                    swal('Upload Error', "Apple certificates files only, file should end with '.p12'.", 'error');
                    return;
                }
                customerimporting = true;
                $scope.Customerappimport.status = 'Uploading ' + $scope.Customerappimport.file.name;
                upload($scope.Customerappimport.file, $scope.Customerappimport.password, true).then(onSuccess, onError, onUpdate);

                function onSuccess(data) {
                    $scope.Customerappimport.status = "Certificate Imported!"
                    customerimporting = false;
                    $scope.customerstate.validApn = true;
                    $scope.customerstate.editing = false;

                    swal('Imported', "Certificate imported", 'success');
                }

                function onError() {
                    $scope.Customerappimport.status = "Error Uploading";
                    customerimporting = false;
                    swal('Error', "Certificate import failed.", 'error');
                }

                function onUpdate(val) {
                    $scope.Customerappimport.percent = val;
                    if (val == 100) {
                        $scope.Customerappimport.percent = null;
                        $scope.Customerappimport.status = "Processing";
                    }
                }
            } else {
                if (!$scope.import.file || importing) {
                    return;
                }
                if (!$scope.import.file.name.endsWith(".p12")) {
                    swal('Upload Error', "Apple certificates files only, file should end with '.p12'.", 'error');
                    return;
                }
                importing = true;
                $scope.import.status = 'Uploading ' + $scope.import.file.name;
                upload($scope.import.file, $scope.import.password, false).then(onSuccess, onError, onUpdate);

                function onSuccess(data) {
                    $scope.import.status = "Certificate Imported!"
                    importing = false;
                    $scope.state.validApn = true;
                    $scope.state.editing = false;

                    swal('Imported', "Certificate imported", 'success');
                }

                function onError() {
                    $scope.import.status = "Error Uploading";
                    importing = false;
                    swal('Error', "Certificate import failed.", 'error');
                }

                function onUpdate(val) {
                    $scope.import.percent = val;
                    if (val == 100) {
                        $scope.import.percent = null;
                        $scope.import.status = "Processing";
                    }
                }
            }
        }

        function upload(file, password, isPassengerCertificate) {
            var deferred = $q.defer();

            var fd = new FormData();
            fd.append('file', file);
            var xhr = new XMLHttpRequest();
            xhr.upload.onprogress = function(e) {
                $scope.$apply(function() {
                    if (e.lengthComputable) {
                        deferred.notify(Math.round(e.loaded / e.total * 100));
                    }
                })
            }
            xhr.onload = function(e) {
                if (e.target.readyState == 4) {
                    if (e.target.status == 200) {
                        deferred.resolve(JSON.parse(e.target.response));
                    } else {
                        deferred.reject(e.target.responseText);
                    }
                }
            }
            xhr.onerror = function(e) {
                deferred.reject(e);
            }
            xhr.onabort = function(e) {
                deferred.reject(e);
            }

            xhr.open('POST', $config.API_ENDPOINT + 'api/ApnDetail?password=' + password + '&isPassengerCertificate=' + isPassengerCertificate);
            xhr.setRequestHeader("Authorization", "Bearer " + Auth.getSession().access_token);
            xhr.setRequestHeader("Accept-Type", "application/json");
            xhr.send(fd);

            return deferred.promise;
        }

        function startEditing() {
            $scope.displayMode = 'EDIT';
        }

        function cancelEditing() {
            $scope.notificationTemplates.$rollback();
            $scope.displayMode = 'VIEW';
        }

        function saveEdits() {
            if ($scope.notificationTemplates.Id) {
                $scope.notificationTemplates.$patch().then(function() {
                    swal('Saved!', "Changes saved successfully.", 'success');
                    $scope.displayMode = 'VIEW';
                }, function() {
                    swal('Error!', "Error saving changes.", 'error');
                });
            } else {
                $scope.notificationTemplates.$save().then(function() {
                    swal('Saved!', "Changes saved successfully.", 'success');
                    $scope.displayMode = 'VIEW';
                }, function() {
                    swal('Error!', "Error saving changes.", 'error');
                });
            }
        }
    }

    SettingsCompanyBasicController.$inject = ['$scope', 'ImageUpload', 'rCompany'];

    function SettingsCompanyBasicController($scope, ImageUpload, rCompany) {
        $scope.company = rCompany[0];
        
        $scope.viewMode = 'VIEW';

        $scope.chooseImage = chooseImage;
        $scope.startEdit = startEdit;
        $scope.cancelEdit = cancelEdit;
        $scope.saveEdits = saveEdits;

        var skip = false;
        $scope.map = {
            center: {
                latitude: $scope.company.BaseLatitude || 51.496384198223355,
                longitude: $scope.company.BaseLongitude || -0.12875142186092202
            },
            zoom: $scope.company.BaseZoom || 11
        };

        $scope.markerOptions = {
            animation: google.maps.Animation.DROP,
            coords: {
                latitude: $scope.company.BaseLatitude || 51.496384198223355,
                longitude: $scope.company.BaseLongitude || -0.12875142186092202
            },
            icon: {
                url: '/includes/images/marker.png',
                scaledSize: new google.maps.Size(48, 48)
            }
        }

        $scope.$watch(function() {
            return '' + $scope.map.center.latitude + $scope.map.center.longitude + $scope.map.zoom;
        }, function() {
            if (skip) {
                skip = false;
                return;
            }

            if ($scope.viewMode == 'EDIT') {
                $scope.company.BaseLatitude = $scope.map.center.latitude;
                $scope.company.BaseLongitude = $scope.map.center.longitude;
                $scope.company.BaseZoom = $scope.map.zoom;
            }
        });

        $scope.$on('address_changed:Base', function(e, n) {
            if ($scope.viewMode == 'EDIT') {
                $scope.map.center.latitude = $scope.company.BaseLatitude.toFixed(6);
                $scope.map.center.longitude = $scope.company.BaseLongitude.toFixed(6);
                $scope.map.zoom = 18;
                skip = true;
                setTimeout(function() {
                    $scope.$apply();
                }, 0);
            }
        });

        $scope.accessors = {
            LogoUrl: function(item) {
                return $scope.company._ImageUrl;
            }
        }

        function chooseImage() {
            ImageUpload.openPicker({
                    type: 'Company',
                    id: $scope.company.Id,
                    searchTerm: $scope.company.Name
                })
                .then(function(result) {
                    $scope.company.LogoUrl = result;
                    saveEdits();
                }, function(result) {});
        };

        function startEdit() {
            $scope.viewMode = 'EDIT';
        }

        function cancelEdit() {
            $scope.company.$rollback(false);
            $scope.viewMode = 'VIEW';
        }

        function saveEdits() {
            $scope.company.$patch().success(function() {
                $scope.viewMode = 'VIEW';
                location.reload();
            });
        }
    }


    SettingsCompanyInvoicingController.$inject = ['$scope', 'Model', 'rCompany', 'rPricingModels', 'rPaymentModels', 'rTaxes', 'rCompanyPaymentSettings'];

    function SettingsCompanyInvoicingController($scope, Model, rCompany, rPricingModels, rPaymentModels, rTaxes, rCompanyPaymentSettings) {
        $scope.company = rCompany[0];
        $scope.cpSettings = rCompanyPaymentSettings[0];
        $scope.paymentModels = rPaymentModels;
        $scope.pricingModels = rPricingModels;
        $scope.taxes = rTaxes;

        $scope.iDviewMode = 'VIEW';
        $scope.cPviewMode = 'VIEW';

        $scope.tax = $scope.taxes.find(function(item) { return item.Name === 'VAT'});

        //Invoice/Payment Details Edit
        $scope.startIdEdit = startIdEdit;
        $scope.cancelIdEdit = cancelIdEdit;
        $scope.saveIdEdits = saveIdEdits;

        //Company Payment Details Edit
        $scope.startCpEdit = startCpEdit;
        $scope.cancelCpEdit = cancelCpEdit;
        $scope.saveCpEdits = saveCpEdits;

        if (!$scope.cpSettings) {
            $scope.cpSettings = new Model.CompanyPaymentSettings();
            $scope.newCpConfig = true;
        } else {
            $scope.newCpConfig = false;
        }

        function startIdEdit() {
            $scope.iDviewMode = 'EDIT';
        }

        function cancelIdEdit() {
            $scope.company.$rollback(false);
            $scope.iDviewMode = 'VIEW';
        }

        function saveIdEdits() {
            $scope.company.$patch().success(function() {
                $scope.iDviewMode = 'VIEW';
                location.reload();
            });
        }

        var cpSettings = null;

        function startCpEdit() {
            $scope.cPviewMode = 'EDIT';
            cpSettings = angular.copy($scope.cpSettings);
        }

        function cancelCpEdit() {
            $scope.cpSettings = cpSettings;
            $scope.cPviewMode = 'VIEW';
        }

        function saveCpEdits() {
            if ($scope.newCpConfig == true) {
                $scope.cpSettings.$save().success(function() {
                    $scope.cPviewMode = 'VIEW';
                    location.reload();
                });
            } else {
                $scope.cpSettings.$patch().success(function() {
                    $scope.cPviewMode = 'VIEW';
                    location.reload();
                });
            }
        }
    }

    SettingsCompanyLocalisationController.$inject = ['$scope', 'rCompany', 'rCurrencies'];

    function SettingsCompanyLocalisationController($scope, rCompany, rCurrencies) {
        $scope.company = rCompany[0];
        $scope.currencies = rCurrencies;
        $scope.availableLocales = [{
            Id: 'en-us',
            Name: 'English (US)'
        }, {
            Id: 'en-gb',
            Name: 'English (UK)'
        }, {
            Id: 'de',
            Name: 'German'
        }, {
            Id: 'fr',
            Name: 'French'
        }, {
            Id: 'ar',
            Name: 'Arabic'
        }, {
            Id: 'ja',
            Name: 'Japanese'
        }, {
            Id: 'ko',
            Name: 'Korean'
        }, {
            Id: 'zh',
            Name: 'Chinese'
        }];

        $scope.zones = [];
        var zones = moment.tz.names();
        zones.forEach(function(zone) {
            $scope.zones.push({
                Id: zone,
                Name: zone
            })
        });

        $scope.viewMode = 'VIEW';

        $scope.startEdit = startEdit;
        $scope.cancelEdit = cancelEdit;
        $scope.saveEdits = saveEdits;

        function startEdit() {
            $scope.viewMode = 'EDIT';
        }

        function cancelEdit() {
            $scope.company.$rollback(false);
            $scope.viewMode = 'VIEW';
        }

        function saveEdits() {
            $scope.company.$patch().success(function() {
                $scope.viewMode = 'VIEW';
                location.reload();
            });
        }
    }

    SettingsCompanyCreditCardsController.$inject = ['$scope', 'rCardProviderDetails', 'rCompany', 'Model', '$http'];

    function SettingsCompanyCreditCardsController($scope, rCardProviderDetails, rCompany, Model, $http) {

        //Initialise
        $scope.cardProviderDetails = rCardProviderDetails;
        $scope.company = rCompany[0];

        //Register Functions
        $scope.startEdit = startEdit;
        $scope.cancelEdit = cancelEdit;
        $scope.saveEdits = saveEdits;

        $scope.$viewMode = 'VIEW';

        //Create blank Payment providers

        $scope.stripeData = new Model.CardPaymentProviderDetail();
        $scope.stripeData.Provider = "Stripe";
        $scope.stripeData.$new = true;

        $scope.judopayData = new Model.CardPaymentProviderDetail();
        $scope.judopayData.Provider = "Judopay";
        $scope.judopayData.$new = true;

        for (i = 0; i < $scope.cardProviderDetails.length; i++) {
            var cp = $scope.cardProviderDetails[i];
            if (cp.Provider == "Stripe") {
                $scope.stripeData = cp;
                $scope.stripeData.$new = false;
            } else if (cp.Provider == "Judopay") {
                $scope.judopayData = cp;
                $scope.judopayData.$new = false;
            }
        }

        function startEdit() {
            $scope.$viewMode = 'EDIT';
        }

        function cancelEdit(index) {
            $scope.company.$rollback(false);
            $scope.stripeData.$rollback(false);
            $scope.judopayData.$rollback(false);
            $scope.$viewMode = 'VIEW';
        }

        function saveEdits(index) {
            $scope.company.$patch().success(function() {
                switch ($scope.company.CurrentCardPaymentProvider) {
                    case "Judopay":
                        $scope.judopayData.IsActive = true;
                        $http.post($config.API_ENDPOINT + 'api/Payments/CardPaymentConfiguration', $scope.judopayData).then(function() {
                            throwSuccess();
                        }, function() {
                            throwError();
                        });

                        break;

                    case "Stripe":
                        $scope.stripeData.IsActive = true;
                        $http.post($config.API_ENDPOINT + 'api/Payments/CardPaymentConfiguration', $scope.stripeData).then(function() {
                            throwSuccess();
                        }, function() {
                            throwError();
                        });
                        break;
                }

                function throwError() {
                    swal("Error", "There was an issue while trying to save the information. Please try again.", "error");
                    $scope.$viewMode = 'VIEW';
                }

                function throwSuccess() {
                    swal({
                        title: "Settings Saved",
                        text: "CAB9 will need to reload to pull new configuration.",
                        type: "success",
                        showCancelButton: false,
                        confirmButtonColor: '#DD6B55',
                        confirmButtonText: 'Reload',
                    }, function() {
                        location.reload();
                    });
                }
            });
        }
    }

    SettingsCompanyDispatchController.$inject = ['$scope', 'rCompany'];

    function SettingsCompanyDispatchController($scope, rCompany) {
        $scope.company = rCompany[0];
        $scope.viewMode = 'VIEW';

        $scope.startEdit = startEdit;
        $scope.cancelEdit = cancelEdit;
        $scope.saveEdits = saveEdits;
        var skip = false;
        $scope.map = {
            center: {
                latitude: $scope.company.DispatchLatitude || 51.496384198223355,
                longitude: $scope.company.DispatchLongitude || -0.12875142186092202
            },
            zoom: $scope.company.DispatchZoom || 11
        };

        $scope.markerOptions = {
            animation: google.maps.Animation.DROP,
            coords: {
                latitude: $scope.company.DispatchLatitude || 51.496384198223355,
                longitude: $scope.company.DispatchLongitude || -0.12875142186092202
            },
            icon: {
                url: '/includes/images/marker.png',
                scaledSize: new google.maps.Size(48, 48)
            }
        }

        $scope.$watch(function() {
            return '' + $scope.map.center.latitude + $scope.map.center.longitude + $scope.map.zoom;
        }, function() {
            if (skip) {
                skip = false;
                return;
            }
            if ($scope.viewMode == 'EDIT') {
                $scope.company.DispatchLatitude = $scope.map.center.latitude;
                $scope.company.DispatchLongitude = $scope.map.center.longitude;
                $scope.company.DispatchZoom = $scope.map.zoom;
            }
        });

        $scope.$on('address_changed:Dispatch', function(e, n) {
            if ($scope.viewMode == 'EDIT') {
                $scope.map.center.latitude = $scope.company.DispatchLatitude.toFixed(6);
                $scope.map.center.longitude = $scope.company.DispatchLongitude.toFixed(6);
                $scope.company.DispatchZoom = $scope.map.zoom = 18;
                skip = true;
                setTimeout(function() {
                    $scope.$apply();
                }, 0);
            }
        });

        function startEdit() {
            $scope.viewMode = 'EDIT';
        }

        function cancelEdit() {
            $scope.company.$rollback(false);
            $scope.viewMode = 'VIEW';
        }

        function saveEdits() {
            $scope.company.$patch().success(function() {
                $scope.viewMode = 'VIEW';
                location.reload();
            });
        }
    }

    SettingsCompanyController.$inject = ['$scope', 'ImageUpload', 'rCompany', 'rCurrencies', 'rPricingModels', 'rPaymentModels', 'rUsers'];

    function SettingsCompanyController($scope, ImageUpload, rCompany, rCurrencies, rPricingModels, rPaymentModels, rUsers) {
        $scope.company = rCompany[0];
        $scope.pricingModels = rPricingModels;
        $scope.currencies = rCurrencies;
        $scope.viewMode = 'VIEW';
        $scope.paymentModels = rPaymentModels;
        $scope.users = rUsers;
        var skip = false;
        $scope.map = {
            center: {
                latitude: $scope.company.BaseLatitude || 51.496384198223355,
                longitude: $scope.company.BaseLongitude || -0.12875142186092202
            },
            zoom: $scope.company.BaseZoom || 13
        };

        $scope.markerOptions = {
            animation: google.maps.Animation.DROP,
            coords: {
                latitude: $scope.company.BaseLatitude || 51.496384198223355,
                longitude: $scope.company.BaseLongitude || -0.12875142186092202
            },
            icon: {
                url: '/includes/images/marker.png',
                scaledSize: new google.maps.Size(48, 48)
            }
        }

        $scope.availableLocales = [{
            Id: 'en-us',
            Name: 'English (US)'
        }, {
            Id: 'en-gb',
            Name: 'English (UK)'
        }, {
            Id: 'de',
            Name: 'German'
        }, {
            Id: 'fr',
            Name: 'French'
        }, {
            Id: 'ar',
            Name: 'Arabic'
        }, {
            Id: 'ja',
            Name: 'Japanese'
        }, {
            Id: 'ko',
            Name: 'Korean'
        }, {
            Id: 'zh',
            Name: 'Chinese'
        }];

        $scope.zones = [];
        var zones = moment.tz.names();
        zones.forEach(function(zone) {
            $scope.zones.push({
                Id: zone,
                Name: zone
            })
        });

        $scope.$watch(function() {
            return '' + $scope.map.center.latitude + $scope.map.center.longitude + $scope.map.zoom;
        }, function() {
            if (skip) {
                skip = false;
                return;
            }
            if ($scope.viewMode == 'EDIT') {
                $scope.company.BaseLatitude = $scope.map.center.latitude;
                $scope.company.BaseLongitude = $scope.map.center.longitude;
                $scope.company.BaseZoom = $scope.map.zoom;
            }
        });

        $scope.$on('address_changed:Base', function(e, n) {
            if ($scope.viewMode == 'EDIT') {
                $scope.map.center.latitude = $scope.company.BaseLatitude.toFixed(6);
                $scope.map.center.longitude = $scope.company.BaseLongitude.toFixed(6);
                $scope.map.zoom = 18;
                skip = true;
                setTimeout(function() {
                    $scope.$apply();
                }, 0);
            }
        });

        $scope.chooseImage = chooseImage;
        $scope.startEdit = startEdit;
        $scope.cancelEdit = cancelEdit;
        $scope.saveEdits = saveEdits;
        $scope.accessors = {
            LogoUrl: function(item) {
                return $scope.company._ImageUrl;
            }
        }

        function chooseImage() {
            ImageUpload.openPicker({
                    type: 'Company',
                    id: $scope.company.Id,
                    searchTerm: $scope.company.Name
                })
                .then(function(result) {
                    $scope.company.LogoUrl = result;
                    saveEdits();
                }, function(result) {});
        };

        function startEdit() {
            $scope.viewMode = 'EDIT';
        }

        function cancelEdit() {
            $scope.company.$rollback(false);
            $scope.viewMode = 'VIEW';
        }

        function saveEdits() {
            $scope.company.$patch().success(function() {
                $scope.viewMode = 'VIEW';
                location.reload();
            });
        }
    }


    module.controller('SettingsCompanyPortalController', SettingsCompanyPortalController);

    SettingsCompanyPortalController.$inject = ['$scope', '$state', '$q', '$config', '$UI', 'Model', 'rSettings', '$modal'];

    function SettingsCompanyPortalController($scope, $state, $q, $config, $UI, Model, rSettings, $modal) {
        $scope.setting = rSettings[0] ? rSettings[0] : new Model.ClientWebBookerSetting();
        $scope.chooseImage = chooseImage;
        $scope.startEdit = startEdit;
        $scope.cancelEdit = cancelEdit;
        $scope.saveEdits = saveEdits;
        $scope.displayMode = 'VIEW';
        $scope.counter = 1;

        function chooseImage() {
            return $modal.open({
                templateUrl: '/webapp/common/views/clients/webBookerSettings/modal/modal.html',
                controller: 'ImageModalController',
                backdrop: 'static',
                resolve: {
                    rSetting: function() {
                        return $scope.setting;
                    }
                }
            }).result.then(function(res) {
                $scope.setting.WelcomeHeroImage = res;
                $scope.counter++;
            }, function(result) {});
        };

        function startEdit() {
            $scope.displayMode = 'EDIT';
        }

        function cancelEdit() {
            $scope.setting.$rollback(false);
            $scope.displayMode = 'VIEW';
        }

        function saveEdits() {
            if ($scope.setting && !$scope.setting.Id) {
                $scope.setting.$save().success(function() {
                    swal({
                        title: "Portal Settings Saved.",
                        text: "Changes have been saved.",
                        type: "success",
                        confirmButtonColor: $UI.COLOURS.brandSecondary
                    });
                    $state.go('root.settings.company.portal', null, {
                        reload: true
                    });
                });
            } else {
                $scope.setting.$patch().success(function() {
                    swal({
                        title: "Portal Settings Saved.",
                        text: "Changes have been updated.",
                        type: "success",
                        confirmButtonColor: $UI.COLOURS.brandSecondary
                    });
                    $scope.displayMode = 'VIEW';
                });
            }
        }
    }

    SettingsWebBookerController.$inject = ['$scope', '$http', '$modal', '$config', '$UI', 'Auth', 'Model', 'rAppConfigs', '$rootScope', '$state'];

    function SettingsWebBookerController($scope, $http, $modal, $config, $UI, Auth, Model, rAppConfigs, $rootScope, $state) {
        $scope.viewMode = 'VIEW';
        $scope.AppConfigs = rAppConfigs || [];
        $scope.configPolygons = [];
        $scope.annotations = {
            firstname: "{{booking_passenger_firstname}}",
            lastname: "{{booking_passenger_Surname}}",
            mobile: "{{booking_passenger_mobile}}",
            email: "{{booking_passenger_email}}",
            bookingid: "{{booking_id}}",
            leadtime: "{{booking_lead_time}}",
            maxmileage: "{{booking_max_mileage}}",
            pickup: "{{booking_pickup}}",
            drop: "{{booking_drop}}"
        };

        $scope.drawingManager = {
            control: {},
            instance: null,
            options: {
                drawingMode: null,
                drawingControl: false,
                drawingControlOptions: {
                    drawingModes: [
                        google.maps.drawing.OverlayType.RECTANGLE,
                        google.maps.drawing.OverlayType.CIRCLE,
                        google.maps.drawing.OverlayType.POLYGON
                    ]
                }
            }
        };

        $scope.templates = [];

        //fetch templates
        $http.get($config.WEBBOOKER_ENDPOINT + 'getTemplates').then(function(response) {
            $scope.templates = response.data;
        }, function() {
            swal({
                title: "Error",
                text: "Error occurred while fetching WebBooker Templates",
                type: "error",
                confirmButtonColor: $UI.COLOURS.brandSecondary
            });
        });

        var originalSetting;
        var idCount = 100000;
        $scope.selected = {
            setting: {}
        };
        $scope.showLabel = true;
        $scope.startEdit = startEdit;
        $scope.saveEdits = saveEdits;
        $scope.cancelEdit = cancelEdit;
        $scope.startEditCoverageArea = startEditCoverageArea;
        $scope.cancelEditCoverageArea = cancelEditCoverageArea;
        $scope.updateCoverageArea = updateCoverageArea;
        $scope.deleteCoverageArea = deleteCoverageArea;
        $scope.addNewCoverageArea = addNewCoverageArea;
        $scope.addNew = addNew;
        $scope.remove = remove;
        $scope.removeAddress = removeAddress;
        $scope.newAddress = newAddress;
        $scope.editAddress = editAddress;

        function newAddress(type) {
            var modalInstance = $modal.open({
                templateUrl: '/webapp/common/modals/webbooker/address/partial.html',
                controller: 'WebBookerAddressCreateController',
                resolve: {
                    rAddress: function() {
                        var address = new Model.WebBookerStops();
                        return address;
                    }
                }
            });
            modalInstance.result.then(function(data) {
                if (type == 'pickup') {
                    $scope.setting.DefaultPickup = data;
                } else {
                    $scope.setting.NearbyDropOffs.push(data);
                }
            });
        }

        function editAddress(address, type, index) {
            var modalInstance = $modal.open({
                templateUrl: '/webapp/common/modals/webbooker/address/partial.html',
                controller: 'WebBookerAddressEditController',
                resolve: {
                    rAddress: {
                        address: address,
                        editIndex: index
                    },
                }
            })

            modalInstance.result.then(function(data) {
                if (type == 'pickup') {
                    $scope.setting.DefaultPickup = data.address;
                } else {
                    $scope.setting.NearbyDropOffs[data.index] = data;
                }
            });
        }

        function removeAddress(type, index) {
            if (type == "dropoff") {
                $scope.setting.NearbyDropOffs.splice(index, 1)
            } else {
                $scope.setting.DefaultPickup = {}
            }
        }

        $scope.$watchCollection('selected', function(newvalue, oldvalue) {
            if (Object.keys(newvalue.setting).length > 0) {
                $scope.setting = new Model.WebBookerDetails(newvalue.setting);
                if ($scope.configPolygons && $scope.configPolygons.length) {
                    $scope.configPolygons = [];
                    $scope.configPolygons.length = 0;
                    setupMap();
                }
                if ($scope.setting.CoverageAreas && $scope.setting.CoverageAreas.length > 0) {
                    //replace by for loop
                    for (i = 0; i < $scope.setting.CoverageAreas.length; i++) {
                        var polyDef = {
                            id: idCount++,
                            path: google.maps.geometry.encoding.decodePath($scope.setting.CoverageAreas[i]).map(function(p) {
                                return {
                                    latitude: p.lat(),
                                    longitude: p.lng()
                                };
                            }),
                            editable: false,
                            draggable: false,
                            stroke: {
                                color: 'black',
                                weight: 5,
                                opacity: 0.8,
                                zIndex: 100000
                            },
                            zIndex: 100000,
                            fit: false
                        };
                        $scope.configPolygons.push(polyDef);
                    }
                }
            }
        });

        fetchWebBookerDetails();

        $scope.$watch(function() {
            return !!$scope.drawingManager.control.getDrawingManager;
        }, function(newvalue) {
            if (newvalue) {
                $scope.drawingManager.instance = $scope.drawingManager.control.getDrawingManager();
            }
        })


        function addNew() {
            return $modal.open({
                templateUrl: '/webapp/common/modals/webbooker/new/partial.html',
                controller: 'CreateWebBookerController',
                backdrop: 'static',
                resolve: {}
            }).result.then(function(res) {
                $state.go($state.current, {}, {
                    reload: true
                });
            }, function(err) {

            });
        }

        function remove() {
            swal({
                title: "Are you sure?",
                text: "Are you sure you want to delete this setting?",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: $UI.COLOURS.brandPrimary,
                confirmButtonText: "Confirm Delete!",
                closeOnConfirm: true
            }, function() {
                $http.delete($config.WEBBOOKER_ENDPOINT + 'api/tenant?tenantid=' + $scope.setting._id).then(function(response) {
                    $state.go($state.current, {}, {
                        reload: true
                    });
                }, function(error) {
                    swal("Error!", "Some Issue while deleting.", "error");
                });
            }, function() {
                swal("Error!", "Some Issue while deleting.", "error");
            });
        }

        function fetchWebBookerDetails() {
            $http.get($config.WEBBOOKER_ENDPOINT + 'api/tenant?tenantid=' + Auth.getSession().TenantId.toUpperCase()).then(function(response) {
                $scope.settings = response.data;
                if (response && response.data[0]) {
                    $scope.setting = $scope.settings[0];
                    $scope.selected.setting = new Model.WebBookerDetails($scope.settings[0]);

                    originalSetting = angular.copy($scope.setting);
                    $scope.mapBounds = new google.maps.LatLngBounds();

                    //initialize company marker on the map.
                    $scope.companyMarker = {
                        coords: {
                            latitude: $scope.COMPANY.BaseLatitude,
                            longitude: $scope.COMPANY.BaseLongitude
                        },
                        options: {
                            animation: google.maps.Animation.DROP,
                            icon: {
                                url: '../../includes/images/marker.png',
                                scaledSize: new google.maps.Size(48, 48)
                            }
                        }
                    };
                    setTimeout(function() {
                        setupMap();
                    });
                }
            }, function(err) {
                swal({
                    title: "Error",
                    text: "Error occurred while fetching WebBooker Data",
                    type: "error",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
            });
        }

        function setupMap() {
            var bounds = new google.maps.LatLngBounds();
            if ($scope.configPolygons.length > 0) {
                for (i = 0; i < $scope.configPolygons.length; i++) {
                    var _zp = $scope.configPolygons[i];
                    for (j = 0; j < _zp.path.length; j++) {
                        bounds.extend(new google.maps.LatLng(_zp.path[j].latitude, _zp.path[j].longitude));
                    }
                }
                $scope.mapBounds = {
                    northeast: {
                        latitude: bounds.getNorthEast().lat(),
                        longitude: bounds.getNorthEast().lng(),
                    },
                    southwest: {
                        latitude: bounds.getSouthWest().lat(),
                        longitude: bounds.getSouthWest().lng(),
                    }
                }
            }
            $scope.map = {
                center: {
                    latitude: $scope.COMPANY.BaseLatitude,
                    longitude: $scope.COMPANY.BaseLongitude
                },
                zoom: 10,
                contol: {}
            };
            $scope.mapSetup = true;
            $scope.$apply();
        }

        function startEdit() {
            $scope.viewMode = 'EDIT';
        }

        function saveEdits() {
            swal({
                title: "Are you sure?",
                text: "Web Booker Settings will be saved",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: $UI.COLOURS.brandPrimary,
                confirmButtonText: "Confirm",
                closeOnConfirm: true
            }, function() {
                $rootScope.loading = true;
                $http.put($config.WEBBOOKER_ENDPOINT + 'api/tenant', $scope.setting).then(function(result) {
                    if (result && result.data) {
                        $scope.setting = new Model.WebBookerDetails(result.data);
                        $rootScope.loading = false;
                        $scope.viewMode = 'VIEW';
                        swal({
                            title: "Updated",
                            text: "Web Booker Settings have been saved",
                            type: "success",
                            confirmButtonColor: $UI.COLOURS.brandSecondary
                        });
                        $state.go($state.current, {}, {
                            reload: true
                        });
                    }
                }, function(err) {
                    $rootScope.loading = false;
                    swal({
                        title: "Error",
                        text: "Some error has occurred while saving WebBooker Data",
                        type: "error",
                        confirmButtonColor: $UI.COLOURS.brandSecondary
                    });
                })
            })
        }

        function cancelEdit() {
            $scope.viewMode = 'VIEW';
            $scope.setting = angular.copy($scope.selected.setting);
        }

        function startEditCoverageArea($index) {
            $scope.selectedCoverageArea = $scope.configPolygons[$index];
            var bounds = new google.maps.LatLngBounds();
            for (j = 0; j < $scope.selectedCoverageArea.path.length; j++) {
                bounds.extend(new google.maps.LatLng($scope.selectedCoverageArea.path[j].latitude, $scope.selectedCoverageArea.path[j].longitude));
            }
            $scope.mapBounds = {
                northeast: {
                    latitude: bounds.getNorthEast().lat(),
                    longitude: bounds.getNorthEast().lng(),
                },
                southwest: {
                    latitude: bounds.getSouthWest().lat(),
                    longitude: bounds.getSouthWest().lng(),
                }
            };
            $scope.map = {
                center: {
                    latitude: $scope.COMPANY.BaseLatitude,
                    longitude: $scope.COMPANY.BaseLongitude
                },
                zoom: 10,
                contol: {}
            };
            $scope.mapSetup = true;
            $scope.$apply();
            $scope.selectedCoverageAreaMode = 'EDIT';
            setupPolyLine('green', true, true, $index);
            $scope.showList = false;
        }

        function setupPolyLine(color, fit, editable, index) {
            $scope.selectedCoverageArea.stroke.color = color;
            $scope.selectedCoverageArea.fit = fit;
            $scope.selectedCoverageArea.editable = editable;
            $scope.selectedCoverageArea.index = index;
        }

        function cancelEditCoverageArea() {
            $scope.selectedCoverageAreaMode = 'VIEW';
            setupPolyLine('black', false, false);
        }

        function updateCoverageArea() {
            $scope.setting.CoverageAreas[$scope.selectedCoverageArea.index] = google.maps.geometry.encoding.encodePath($scope.selectedCoverageArea.path.map(function(p) {
                return new google.maps.LatLng(p.latitude, p.longitude);
            }));
            console.log($scope.setting.CoverageAreas);
            $scope.selectedCoverageAreaMode = 'VIEW';
            setupPolyLine('black', false, false);
        }

        function deleteCoverageArea(index) {
            swal({
                title: "Are you sure?",
                text: "Coverage Area will be deleted",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: $UI.COLOURS.brandPrimary,
                confirmButtonText: "Confirm.",
                closeOnConfirm: true
            }, function() {
                $scope.setting.CoverageAreas.splice(index, 1);
                $scope.configPolygons.splice(index, 1);
                setupMap();
            });
        }

        function addNewCoverageArea() {
            $scope.selectedCoverageAreaMode = 'CREATE';
            $scope.drawingManager.options.drawingMode = google.maps.drawing.OverlayType.POLYGON;
            $scope.drawingManager.instance.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
            $scope.currentCompleteHandler = google.maps.event.addListener($scope.drawingManager.instance, 'overlaycomplete', function(event) {
                if (event.type == google.maps.drawing.OverlayType.POLYGON) {
                    event.overlay.setMap(null);

                    var encodedPath = google.maps.geometry.encoding.encodePath(event.overlay.getPath())
                    console.log(encodedPath);
                    var polyDef = {
                        id: idCount++,
                        path: google.maps.geometry.encoding.decodePath(encodedPath).map(function(p) {
                            return {
                                latitude: p.lat(),
                                longitude: p.lng()
                            };
                        }),
                        editable: true,
                        draggable: true,
                        stroke: {
                            color: 'black',
                            weight: 5,
                            opacity: 0.8
                        },
                        $CoverageArea: $scope.selectedCoverageArea
                    };
                    $scope.selectedCoverageArea = polyDef;
                    $scope.configPolygons.push(polyDef);

                    $scope.drawingManager.options.drawingMode = null;
                    $scope.drawingManager.instance.setDrawingMode(null);
                    $scope.currentCompleteHandler.remove();
                    $scope.setting.CoverageAreas.push(encodedPath);
                    $scope.selectedCoverageAreaMode = 'VIEW';
                    $scope.$apply();
                }
            });
        }

        function fitBounds() {

        }
    }

    SettingsFTPDetailsController.$inject = ['$scope', '$http', '$modal', '$config', '$UI', 'Model'];

    function SettingsFTPDetailsController($scope, $http, $modal, $config, $UI, Model) {

        $scope.ftpDetails = {};
        $scope.viewMode = "VIEW";

        $scope.deleteFTPDetails = deleteFTPDetails;
        $scope.addFTPDetails = addFTPDetails;
        $scope.saveFTPDetails = saveFTPDetails;
        $scope.editFTPDetails = editFTPDetails;
        $scope.cancelFTPEditing = cancelFTPEditing;

        function addFTPDetails() {
            $scope.ftpDetails = {};
            $scope.viewMode = "ADD";
        }

        function editFTPDetails() {
            $scope.viewMode = "EDIT";
        }

        //get Existing FTP Details
        function fetchFTPDetails() {
            $scope.fetchingFTPDetails = true;

            $http({
                method: 'GET',
                url: $config.API_ENDPOINT + '/api/ftpdetails'
            }).then(function successCallback(response) {
                $scope.ftpDetails = response.data;
                $scope.fetchingFTPDetails = false;
            }, function errorCallback(response) {
                swal('Error Occurred', response.data.Message, 'error');
                $scope.fetchingFTPDetails = false;
            });
        };

        fetchFTPDetails();
        //functions to allow add/edit of FTP Details
        function saveFTPDetails() {
            $scope.savingFTPDetails = true;
            if ($scope.viewMode == "ADD") {
                $http({
                    method: 'POST',
                    url: $config.API_ENDPOINT + '/api/ftpdetails/add',
                    data: $scope.ftpDetails
                }).then(function successCallback(response) {
                    swal('FTP Details Added', "The FTP details have been added.", 'success');
                    $scope.viewMode = "VIEW";
                    $scope.ftpDetails = response.data;
                    $scope.savingFTPDetails = false;
                }, function errorCallback(response) {
                    swal('Error Occurred', response.data.Message, 'error');
                    $scope.savingFTPDetails = false;
                });
            } else {
                $http({
                    method: 'PUT',
                    url: $config.API_ENDPOINT + '/api/ftpdetails/update',
                    data: $scope.ftpDetails
                }).then(function successCallback(response) {
                    swal('FTP Details Updated', "The FTP details have been updated.", 'success');
                    $scope.viewMode = "VIEW";
                    $scope.ftpDetails = response.data;
                    $scope.savingFTPDetails = false;
                }, function errorCallback(response) {
                    swal('Error Occurred', response.data.Message, 'error');
                    $scope.savingFTPDetails = false;
                });
            }
        }

        //function to delete ftp details
        function deleteFTPDetails() {
            $scope.deletingFTPDetails = true;

            swal({
                title: "Are you sure?",
                text: "Are you sure you want to delete the FTP Details",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: $UI.COLOURS.brandPrimary,
                confirmButtonText: "Confirm Delete",
                closeOnConfirm: true
            }, function() {
                $http({
                    method: 'DELETE',
                    url: $config.API_ENDPOINT + '/api/ftpdetails?ftpDetailsId=' + $scope.ftpDetails.Id
                }).then(function successCallback(response) {
                    swal('FTP Details Deleted', "The FTP details have been deleted.", 'success');
                    $scope.ftpDetails = null;
                    $scope.deletingFTPDetails = false;
                }, function errorCallback(response) {
                    swal('Error Occurred', response.data.Message, 'error');
                    $scope.deletingFTPDetails = false;
                });
            }, function() {
                swal("Error!", "Some Issue while deleting.", "error");
            });
        }

        function cancelFTPEditing() {
            fetchFTPDetails();
            $scope.viewMode = "VIEW";
        }
        
    }
}(angular));
