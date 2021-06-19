(function(angular) {
    var module = angular.module('cab9.clients');

    module.controller('ClientItemInfoController', clientItemInfoController);

    clientItemInfoController.$inject = ['$scope', '$q', 'Model', '$http', 'ImageUpload', 'rData', 'rClientTypes', 'rClientTags', 'rPricingModels', 'rValidations', '$UI', '$config', '$state', '$stateParams', 'rStaff', 'rVehicleTypes', 'rTaxes'];

    function clientItemInfoController($scope, $q, Model, $http, ImageUpload, rData, rClientTypes, rClientTags, rPricingModels, rValidations, $UI, $config, $state, $stateParams, rStaff, rVehicleTypes, rTaxes) {
        $scope.client = rData[0];
        console.log($scope.client.RoutingOption);
        $scope.comOptions = [{ value: null, text: 'Company Default' }, { value: true, text: 'Yes' }, { value: false, text: 'No' }]
        $scope.nullValue = null;
        $scope.clientTypes = rClientTypes;
        $scope.vehicleTypes = rVehicleTypes.map(function(x) { x.ImageUrl = x._ImageUrl; return x; });
        $scope.clientTags = rClientTags;
        $scope.pricingModels = rPricingModels;
        $scope.displayMode = 'VIEW';
        $scope.copyToBilling = copyToBilling;
        $scope.staff = rStaff;
        $scope.deleteCancellationRule = deleteCancellationRule;
        $scope.taxes = rTaxes;
        $scope.alreadySelected = alreadySelected;

        var originalTags = angular.copy($scope.client.Tags);

        function manageAccountPaymentTypes() {
            if ($scope.client.AllowedPaymentTypes) {
                var pTA = $scope.client.AllowedPaymentTypes.replaceAll(" ", "").split(",");
                if (pTA.indexOf("Card") > -1) {
                    $scope.client.$AllowCard = true;
                }
                if (pTA.indexOf("Cash") > -1) {
                    $scope.client.$AllowCash = true;
                }
                if (pTA.indexOf("OnAccount") > -1) {
                    $scope.client.$AllowAccount = true;
                }
            }
        }

        manageAccountPaymentTypes();

        $scope.chooseImage = chooseImage;
        $scope.startEditing = startEditing;
        $scope.cancelEditing = cancelEditing;
        $scope.saveEdits = saveEdits;
        $scope.recalcJobs = recalcJobs;

        function recalcJobs() {
            if (confirm("Are You Sure?")) {
                $http.get($config.API_ENDPOINT + 'api/bookings/Reprice', {
                    params: {
                        clientId: $scope.client.Id
                    }
                }).then(function() {
                    alert("Scheduled.");
                });
            }
        }

        $scope.groupOptions = [
            { Id: '', Name: 'None' },
            { Id: 'Passenger', Name: 'Passenger' },
            { Id: 'Booker', Name: 'Booker' },
            { Id: 'Reference', Name: 'Reference' },
        ];

        [].push.apply($scope.groupOptions, rValidations);

        function chooseImage() {
            ImageUpload.openPicker({
                    type: 'Client',
                    id: $scope.client.Id,
                    searchTerm: $scope.client.Name
                })
                .then(function(result) {
                    $scope.client.ImageUrl = result;
                    saveEdits();
                }, function(result) {});
        };

        function startEditing() {
            $scope.displayMode = 'EDIT';
        }

        function cancelEditing() {
            $scope.client.$rollback(true);
            $scope.displayMode = 'VIEW';
        }

        function copyToBilling(type) {
            if (type == 'contact') {
                $scope.client.BillingContact = $scope.client.PrimaryContact;
                $scope.client.BillingPhone = $scope.client.Phone;
                $scope.client.BillingMobile = $scope.client.Mobile;
                $scope.client.BillingFax = $scope.client.Fax;
                $scope.client.BillingEmail = $scope.client.Email;
            } else if (type == 'address') {
                $scope.client.BillingAddress1 = $scope.client.Address1;
                $scope.client.BillingAddress2 = $scope.client.Address2;
                $scope.client.BillingArea = $scope.client.Area;
                $scope.client.BillingTownCity = $scope.client.TownCity;
                $scope.client.BillingPostcode = $scope.client.Postcode;
                $scope.client.BillingCounty = $scope.client.County;
                $scope.client.BillingCountry = $scope.client.Country;
                $scope.client.BillingLatitude = $scope.client.Latitude;
                $scope.client.BillingLongitude = $scope.client.Longitude;
            }
        }

        function removeKeys(obj, keys) {
            var index;
            for (var prop in obj) {
                // important check that this is objects own property
                // not from prototype prop inherited
                if (obj.hasOwnProperty(prop)) {
                    switch (typeof(obj[prop])) {
                        case 'string':
                            index = keys.indexOf(prop);
                            if (index > -1) {
                                delete obj[prop];
                            }
                            break;
                        case 'object':
                            index = keys.indexOf(prop);
                            if (index > -1) {
                                delete obj[prop];
                            } else {
                                removeKeys(obj[prop], keys);
                            }
                            break;
                    }
                }
            }
        }

        function deleteCancellationRule() {
            swal({
                    title: "Are you sure?",
                    text: "Cancellation rule will be deleted",
                    type: "warning",
                    showCancelButton: true,
                    confirmButtonColor: '#DD6B55',
                    confirmButtonText: 'Yes, delete it!',
                    closeOnConfirm: false
                },
                function() {
                    var promises = [];
                    var cancellationRule = new Model.CancellationRule($scope.client.CancellationRule);

                    $scope.client.CancellationRuleId = null;
                    $scope.client.CancellationRule = null;

                    $scope.client.$patch().then(function() {
                        cancellationRule.$delete().then(function() {
                            swal({
                                title: "Client Saved.",
                                text: "Changes have been updated.",
                                type: "success",
                                confirmButtonColor: $UI.COLOURS.brandSecondary
                            });
                            $state.go($state.current, {
                                Id: $stateParams.Id
                            }, {
                                reload: true
                            })
                        });
                    });

                },
                function(err) {
                    swal({
                        title: "Some Error Occured.",
                        text: "Some error has occured.",
                        type: "error",
                        confirmButtonColor: $UI.COLOURS.brandSecondary
                    });
                })

        }

        function saveEdits() {
            var promises = [];
            var pTA = [];
            if ($scope.client.$AllowCard) {
                pTA.push("Card");
            }

            if ($scope.client.$AllowCash) {
                pTA.push("Cash");
            }

            if ($scope.client.$AllowAccount) {
                pTA.push("OnAccount");
            }

            $scope.client.AllowedPaymentTypes = pTA.join(",");

            var cancellationRule = new Model.CancellationRule($scope.client.CancellationRule);

            if ($scope.client.CancellationRuleId) {
                promises.push(cancellationRule.$update());
                $scope.client.CancellationRule = null;
            }

            if (angular.isDefined($scope.client.$$changedValues.Tags)) {
                var changes = originalTags.changes($scope.client.$$changedValues.Tags, function(a, b) {
                    return a.Id == b.Id;
                });
                angular.forEach(changes.removed, function(remove) {
                    promises.push(Model.$dissociate("Client", "ClientTags", $scope.client.Id, remove.Id));
                });
                angular.forEach(changes.added, function(add) {
                    promises.push(Model.$associate("Client", "ClientTags", $scope.client.Id, add.Id));
                });
            }

            promises.push($scope.client.$patch());

            $q.all(promises).then(function() {
                swal({
                    title: "Client Saved.",
                    text: "Changes have been updated.",
                    type: "success",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
                $state.go($state.current, {
                    Id: $stateParams.Id
                }, {
                    reload: true
                })
            }, function() {
                alert('Error');
                console.log(arguments);
            });
        }

        function alreadySelected(tag) {
            var currentTagIds = $scope.client.Tags.map(function (t) { return t.Id });

            return currentTagIds.indexOf(tag.Id) == -1
        }
    }
})(angular);


String.prototype.replaceAll = function(target, replacement) {
    return this.split(target).join(replacement);
};
