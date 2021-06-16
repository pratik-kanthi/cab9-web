(function(angular) {
    var module = angular.module('cab9.drivers');
    module.controller('DriverItemFixedRatesController', DriverItemFixedRatesController);
    DriverItemFixedRatesController.$inject = ['$scope', '$UI', '$q', '$state', '$stateParams', 'Model', 'rFixedCount', 'rFixeds', 'rVehicleTypes', 'rZones', '$http', '$config', '$modal'];
    function DriverItemFixedRatesController($scope, $UI, $q, $state, $stateParams, Model, rFixedCount, rFixeds, rVehicleTypes, rZones, $http, $config, $modal) {
        $scope.paging = {
            currentPage: 1,
            resultsPerPage: 10,
            totalResults: null,
            maxPages: null
        };
        $scope.paging.totalResults = rFixedCount.length;
        $scope.paging.maxPages = Math.ceil($scope.paging.totalResults / $scope.paging.resultsPerPage);
        $scope.setPage = setPage;
        $scope.filter = filter;
        $scope.fixeds = rFixeds;
        angular.forEach($scope.fixeds, function (f) {
            var vts = f.VehicleTypes.map(function (v) { return new Model.VehicleTypeInDriverFixed(v); });
            f.VehicleTypes.length = 0;
            [].push.apply(f.VehicleTypes, vts);
        });
        $scope.vehicleTypes = rVehicleTypes;
        $scope.zones = rZones;
        $scope.currentlyEditing = null;
        $scope.currentlyCreating = null;
        $scope.startNew = startNew;
        $scope.confirmNew = confirmNew;
        $scope.cancelNew = cancelNew;
        $scope.startEditing = startEditing;
        $scope.remove = remove;
        $scope.confirmEditing = confirmEditing;
        $scope.cancelEditing = cancelEditing;
        $scope.getVehicleTypeCost = getVehicleTypeCost;
        $scope.setVehicleTypeCost = setVehicleTypeCost;
        
        $scope.prices = [];
        $scope._pindex = 0;

        $scope.zones.unshift({
            Id: null,
            Name: 'Custom Postcode -',
        })
        $scope.filters = {
            fromZone: null,
            toZone: null,
            fromPostcode: null,
            toPostcode: null
        }

        function startNew() {
            $scope.currentlyCreating = new Model.DriverFixed();
            $scope.currentlyCreating.DriverId = $scope.item.Id;
        }

        function filter() {
            var query = Model.DriverFixed.query()
                .select('Id')
                .parseAs(function (data) {
                    this.Id = data.Id;
                })
                .filter('DriverId', 'eq', "guid'" + $stateParams.Id + "'");
            if ($scope.filters.fromZone && $scope.filters.fromZone != "")
                query.filter("FromId eq guid'" + $scope.filters.fromZone + "'")
            if ($scope.filters.toZone && $scope.filters.toZone != "")
                query.filter("ToId eq guid'" + $scope.filters.toZone + "'")
            if ($scope.filters.fromPostcode && $scope.filters.fromPostcode != "")
                query.filter("FromPostcode eq'" + $scope.filters.fromPostcode + "'")
            if ($scope.filters.toPostcode && $scope.filters.toPostcode != "")
                query.filter("ToPostcode eq '" + $scope.filters.toPostcode + "'")

            query.execute().then(function (response) {
                $scope.paging.totalResults = response.length;
                $scope.paging.maxPages = Math.ceil($scope.paging.totalResults / $scope.paging.resultsPerPage);
                setPage(1);
            }, function (err) {
                swal({
                    title: "Some Error Occured.",
                    text: "Some error has occured.",
                    type: "error",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
            })
        }

        function setPage(page) {
            $scope.paging.currentPage = page;
            var query = Model.DriverFixed.query()
                .include('VehicleTypes,From,To')
                .filter('DriverId', 'eq', "guid'" + $stateParams.Id + "'")
                // .orderBy('CreationTime desc')
                .skip($scope.paging.resultsPerPage * ($scope.paging.currentPage - 1))
                .top($scope.paging.resultsPerPage)
                .trackingEnabled()

            if ($scope.filters.fromZone && $scope.filters.fromZone != "")
                query.filter("FromId eq guid'" + $scope.filters.fromZone + "'")
            if ($scope.filters.toZone && $scope.filters.toZone != "")
                query.filter("ToId eq guid'" + $scope.filters.toZone + "'")
            if ($scope.filters.fromPostcode && $scope.filters.fromPostcode != "")
                query.filter("FromPostcode eq'" + $scope.filters.fromPostcode + "'")
            if ($scope.filters.toPostcode && $scope.filters.toPostcode != "")
                query.filter("ToPostcode eq '" + $scope.filters.toPostcode + "'")

            query.execute().then(function (response) {
                $scope.fixeds = response;
                angular.forEach($scope.fixeds, function (f) {
                    var vts = f.VehicleTypes.map(function (v) { return new Model.VehicleTypeInDriverFixed(v); });
                    f.VehicleTypes.length = 0;
                    [].push.apply(f.VehicleTypes, vts);
                });
            }, function (err) {
                swal({
                    title: "Some Error Occured.",
                    text: "Some error has occured.",
                    type: "error",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
            })
        }

        function confirmNew() {
            saveDetails();

            function checkFromPostcode() {
                if ($scope.currentlyCreating.FromId == null) {
                    if ($scope.currentlyCreating.FromPostcode == null || $scope.currentlyCreating.FromPostcode.length < 2) {
                        swal('Error', 'Please select either a From Zone or enter a valid Postcode Prefix', 'error');
                        return;
                    } else {
                        $http({
                            method: 'GET',
                            url: 'http://api.postcodes.io/outcodes/' + $scope.currentlyCreating.FromPostcode
                        }).then(function (result) {
                            checkToPostcode();
                        }, function (error) {
                            checkToPostcode();
                            swal('Not Found', 'From Postcode Not Found.', 'error');
                            return;
                        });
                    }
                } else {
                    checkToPostcode();
                }
            }

            function checkToPostcode() {
                if ($scope.currentlyCreating.ToId == null) {
                    if ($scope.currentlyCreating.ToPostcode == null || $scope.currentlyCreating.ToPostcode.length < 2) {
                        swal('Error', 'Please select either a To Zone or enter a valid Postcode Prefix', 'error');
                        return;
                    } else {
                        $http({
                            method: 'GET',
                            url: 'http://api.postcodes.io/outcodes/' + $scope.currentlyCreating.ToPostcode
                        }).then(function successCallback(response) {
                            saveDetails();
                        }, function errorCallback(response) {
                            saveDetails();
                            swal('Not Found', 'To Postcode Not Found.', 'error');
                            return;
                        });
                    }
                } else {
                    saveDetails();
                }
            }

            function saveDetails() {
                $scope.currentlyCreating.$save(true).success(function (item) {
                    $scope.currentlyCreating = null;
                    $state.go($state.current, $stateParams, {
                        reload: true
                    })
                })
            }
        }

        function cancelNew() {
            $scope.currentlyCreating = null;
        }

        function startEditing(item) {
            $scope.currentlyEditing = item;
        }

        function remove(item) {
            swal({
                title: "Are you sure?",
                text: "You will not be able to recover this fixed rate!",
                type: "warning",
                showCancelButton: true,
                confirmButtonText: "Yes, delete it!",
                closeOnConfirm: true
            }, function () {
                item.$delete()
                    .success(function () {
                        var index = $scope.fixeds.indexOf(item);
                        $scope.fixeds.splice(index, 1);
                    }).error(function () {

                    });
            });
        }

        function confirmEditing(item) {
            $http.post($config.API_ENDPOINT + 'api/PricingModels/updatepaymentfixed', item)
                .then(function () {
                    $scope.currentlyEditing = null;
                    setPage($scope.paging.currentPage);
                    swal({
                        title: "Fixed Price Updated.",
                        text: "Changes have been updated.",
                        type: "success",
                        confirmButtonColor: $UI.COLOURS.brandSecondary
                    });
                }, function () {
                    console.log("Error occured");
                });
        }

        function cancelEditing(item) {
            $scope.currentlyEditing.$rollback(true);
            angular.forEach(item.VehicleTypes, function (f) {
                f.$rollback(true);
            });
            $scope.currentlyEditing = null;
        }

        function getVehicleTypeCost(fixed, vt) {
            var typePricing = fixed.VehicleTypes.filter(function (v) {
                return v.VehicleTypeId == vt.Id;
            })[0];
            if (typePricing) {
                return typePricing.FixedPayment;
            } else {
                return null;
            }
        }

        function setVehicleTypeCost(fixed, vt, value) {
            fixed.VehicleTypes = fixed.VehicleTypes || [];
            var typePricing = fixed.VehicleTypes.filter(function (v) {
                return v.VehicleTypeId == vt.Id;
            })[0];
            if (typePricing) {
                typePricing.FixedPayment = value;
            } else if (value) {
                var n = new Model.VehicleTypeInDriverFixed();
                n.VehicleTypeId = vt.Id;
                n.PaymentFixedId = fixed.Id;
                n.FixedPayment = value;
                fixed.VehicleTypes.push(n);
            }
        }
    }
})(angular)