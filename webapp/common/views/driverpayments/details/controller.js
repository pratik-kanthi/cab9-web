(function(angular) {
    var module = angular.module('cab9.common');

    module.controller('DriverPaymentModelDetailsController', driverPaymentModelDetailsController);

    driverPaymentModelDetailsController.$inject = ['$scope', '$state', '$q', '$UI', '$modal', 'rData', 'rVehicleTypes', 'Model'];

    function driverPaymentModelDetailsController($scope, $state, $q, $UI, $modal, rData, rVehicleTypes, Model) {
        $scope.item = rData[0];
        var overrides = $scope.item.Overrides.map(function(item) {
            return new Model.DriverPaymentModelOverride(item);
        });
        $scope.item.Overrides = [];
        $scope.vehicleTypes = rVehicleTypes;
        $scope.clientOverrides = [];
        $scope.selectedOverride = $scope.item;
        $scope.item.$overrides = [];

        $scope.new = {};

        $scope.orphans = [];

        angular.forEach(overrides, function(x) {
            if (x.ClientId && !x.VehicleTypeId && !x.PaymentType) {
                x.$overrides = [];
                $scope.clientOverrides.push(x);
            }
        });

        angular.forEach(overrides, function (x) {
            if (x.VehicleTypeId && !x.PaymentType) {
                if (x.ClientId) {
                    var found = $scope.clientOverrides.filter(function(c) { return c.ClientId == x.ClientId; })[0];
                    if (found) {
                        found.$overrides = (found.$overrides || []);
                        found.$overrides.push(x);
                    } else {
                        $scope.orphans.push(x);
                    }
                } else {
                    $scope.item.$overrides = ($scope.item.$overrides || []);
                    $scope.item.$overrides.push(x);
                }
            }
        });

        angular.forEach(overrides, function (x) {
            if (x.PaymentType) {
                if (x.ClientId) {
                    var found = $scope.clientOverrides.filter(function (c) { return c.ClientId == x.ClientId; })[0];
                    if (found) {
                        if (x.VehicleTypeId) {
                            found = found.$overrides.filter(function (c) { return c.VehicleTypeId == x.VehicleTypeId })[0];
                            if (found) {
                                found[x.PaymentType] = x;
                            } else {
                                $scope.orphans.push(x);
                            }
                        } else {
                            found[x.PaymentType] = x;
                        }
                    } else {
                        $scope.orphans.push(x);
                    }
                } else {
                    if (x.VehicleTypeId) {
                        var found = $scope.item.$overrides.filter(function (c) { return c.VehicleTypeId == x.VehicleTypeId })[0];
                        if (found) {
                            found[x.PaymentType] = x;
                        } else {
                            $scope.orphans.push(x);
                        }
                    } else {
                        $scope.item[x.PaymentType] = x;
                    }
                }
            }
        });

        Model.Client.query().execute().then(function(response) {
            $scope.clients = response;
        }, function(err) {
            swal({
                title: "Some Error Occured.",
                text: "Some error has occured.",
                type: "error",
                confirmButtonColor: $UI.COLOURS.brandSecondary
            });
        });

        $scope.viewMode = "EDIT";

        $scope.save = save;
        $scope.reset = reset;
        $scope.remove = remove;
        $scope.addOverride = addOverride;
        $scope.addNewPaymentOverride = addNewPaymentOverride;
        $scope.alreadyOverriding = alreadyOverriding;

        $scope.startEdit = startEdit;
        $scope.newClientOverride = newClientOverride;
        $scope.addClientOverride = addClientOverride;
        $scope.canceAddOverride = canceAddOverride;
        $scope.selectOverride = selectOverride;
        $scope.saveOverrideEdit = saveOverrideEdit;
        $scope.getVehicleType = function(o) {
            return rVehicleTypes.filter(function(vt) { return o.VehicleTypeId == vt.Id })[0].Name;
        }

        function alreadyOverriding(vts) {
            return $scope.selectedOverride.$overrides.filter(function(o) { return vts.Id == o.VehicleTypeId }).length == 0;
        }

        function startEdit() {
            $scope.viewMode = "EDIT";
        }

        function save(item, parent, type) {
            var x = null;
            if (item.Id) {
                x = item.$patch();
            } else {
                x = item.$save();
            }
            x.then(function (result) {
                swal('Success!', 'Saved.', 'success');
            });
        }

        function reset(item, parent, type) {
            item.$rollback();
            $scope.viewMode = "VIEW";
        }

        function remove(item, parent, type) {
            if (!item.Id) {
                if (!parent) {
                    var index = $scope.clientOverrides.indexOf(parent);
                    $scope.clientOverrides.splice(index, 1);
                    $scope.selectedOverride = $scope.item;
                } else if (!type) {
                    var index = parent.$overrides.indexOf(item);
                    parent.$overrides.splice(index, 1);
                } else {
                    parent[type] = null;
                }
            } else {
                swal({
                    title: "Are you sure?",
                    text: "This Override will be deleted permanentaly",
                    type: "warning",
                    showCancelButton: true,
                    confirmButtonText: "Yes, delete it!",
                    closeOnConfirm: true
                }, function () {
                    if (item.Cash && item.Cash.Id) {
                        item.Cash.$delete().then(function () { item.Cash = null; });
                    }
                    if (item.Card && item.Card.Id) {
                        item.Card.$delete().then(function () { item.Card = null; });
                    }
                    item.$delete().then(function () {
                        swal("Success", "Pricing Model deleted.", "success")
                        var x = null;
                        if (item.Id) {
                            x = item.$delete();
                        } else {
                            //x = item.$save();
                        }
                        x.then(function () {
                            swal('Success!', 'Removed.', 'success');
                            if (!parent) {
                                var index = $scope.clientOverrides.indexOf(parent);
                                $scope.clientOverrides.splice(index, 1);
                                $scope.selectedOverride = $scope.item;
                            } else if (!type) {
                                var index = parent.$overrides.indexOf(item);
                                parent.$overrides.splice(index, 1);
                            } else {
                                parent[type] = null;
                            }
                        });
                    }, function (err) {
                        swal("Error", "Error on deleting pricing model.", "error");

                    });
                });
            }
        }

        function addNewPaymentOverride(type, parent) {
            var x = new Model.DriverPaymentModelOverride();
            x.DriverPaymentModelId = $scope.item.Id;
            x.ClientId = parent.ClientId;
            x.VehicleTypeId = parent.VehicleTypeId;
            x.OwnCarPerMileSteps = parent.OwnCarPerMileSteps;
            x.CompanyCarPerMileSteps = parent.CompanyCarPerMileSteps;
            x.OwnCarCommission = parent.OwnCarCommission;
            x.CompanyCarCommission = parent.CompanyCarCommission;
            x.WeeklyRent = parent.WeeklyRent;
            x.PerHour = parent.PerHour;
            x.PerBooking = parent.PerBooking;
            x.ChauffeurCommision = parent.ChauffeurCommision;
            x.ChauffeurPerHour = parent.ChauffeurPerHour;
            x.WaitingPerHour = parent.WaitingPerHour;
            x.Type = parent.Type;
            x.PaymentType = type;
            parent[type] = x;
        }

        function addOverride(vt, parent) {
            var x = new Model.DriverPaymentModelOverride();
            x.DriverPaymentModelId = $scope.item.Id;
            x.ClientId = parent.ClientId;
            x.VehicleTypeId = vt;
            x.OwnCarPerMileSteps = parent.OwnCarPerMileSteps;
            x.CompanyCarPerMileSteps = parent.CompanyCarPerMileSteps;
            x.OwnCarCommission = parent.OwnCarCommission;
            x.CompanyCarCommission = parent.CompanyCarCommission;
            x.WeeklyRent = parent.WeeklyRent;
            x.PerHour = parent.PerHour;
            x.PerBooking = parent.PerBooking;
            x.Type = parent.Type;
            x.ChauffeurCommision = parent.ChauffeurCommision;
            x.WaitingPerHour = parent.WaitingPerHour;
            x.ChauffeurPerHour = parent.ChauffeurPerHour;
            parent.$overrides.push(x);
            $scope.new = {};
        }

        function saveOverrideEdit() {
            $scope.selectedOverride.$patch().then(function(response) {
                swal({
                    title: "Client Override Updated.",
                    text: "Changes have been updated.",
                    type: "success",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
                $scope.selectedOverride.$commit();
            }, function(err) {
                swal({
                    title: "Some Error Occured.",
                    text: "Some error has occured.",
                    type: "error",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
            })
        }

        function resetOverride() {
            $scope.selectedOverride.$rollback();
        }

        function selectOverride(override) {
            $scope.selectedOverride = override;
        }

        function canceAddOverride() {
            $scope.newOverride = null;
        }

        function addClientOverride() {
            $scope.newOverride.$save().then(function(response) {
                swal({
                    title: "Client Override Added.",
                    text: "Changes have been updated.",
                    type: "success",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
                $scope.newOverride = null;
                response.data.Client = $scope.clients.filter(function(item) {
                    return item.Id == response.data.ClientId
                })[0];
                $scope.selectedOverride = new Model.DriverPaymentModelOverride(response.data);
                $scope.selectedOverride.$overrides = [];
                $scope.clientOverrides.push($scope.selectedOverride);
            }, function(err) {
                swal({
                    title: "Some Error Occured.",
                    text: "Some error has occured.",
                    type: "error",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
            });
        }

        function newClientOverride() {
            $scope.newOverride = new Model.DriverPaymentModelOverride();
            $scope.newOverride.DriverPaymentModelId = $scope.item.Id;
            $scope.newOverride.OwnCarPerMileSteps = $scope.item.OwnCarPerMileSteps;
            $scope.newOverride.Type = $scope.item.Type;
            $scope.newOverride.CompanyCarPerMileSteps = $scope.item.CompanyCarPerMileSteps;
            $scope.newOverride.OwnCarCommission = $scope.item.OwnCarCommission;
            $scope.newOverride.CompanyCarCommission = $scope.item.CompanyCarCommission;
            $scope.newOverride.WeeklyRent = $scope.item.WeeklyRent;
            $scope.newOverride.PerHour = $scope.item.PerHour;
            $scope.newOverride.PerBooking = $scope.item.PerBooking;
            $scope.newOverride.ChauffeurCommision = $scope.item.ChauffeurCommision;
            $scope.newOverride.ChauffeurPerHour = $scope.item.ChauffeurPerHour;
            $scope.newOverride.WaitingPerHour = $scope.item.WaitingPerHour;
        }
    }
}(angular))