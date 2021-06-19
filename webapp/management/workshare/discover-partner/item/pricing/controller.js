(function (angular) {
    var module = angular.module('cab9.workshare');
    module.controller('WorksharePartnerpricingController', WorksharePartnerpricingController);

    WorksharePartnerpricingController.$inject = ['$scope', '$tenantConfig', 'Model', '$http', 'Localisation', '$config'];

    function WorksharePartnerpricingController($scope, $tenantConfig, Model, $http, Localisation, $config) {
        $scope.viewMode = 'EDIT';
        $scope.activeTab = 'Default'
        // vehicle types of the partner tenant
        $scope.vehicleOverrides = [];
        $scope.distance = null;
        if ($scope.companyProfile.CoverageArea) {
            $scope.coverageAreas = $scope.companyProfile.CoverageArea.split(',');
        }
        $scope.fetching = true;
        $http.get($config.API_ENDPOINT + 'api/partners/profile/service?profileId=' + $scope.companyProfile.Id)
            .success(function (data) {
                $scope.services = data;
                fetchPricingModelDetails();
            })
            .error(function (res) {
                $scope.fetching = false;
                swal("Error", res.ExceptionMessage, "error");
            });

        $scope.addStop = addStop;
        $scope.getAllQuotes = getAllQuotes;
        $scope.setActiveTab = setActiveTab;
        $scope.getPreviousStep = getPreviousStep;
        $scope.polygons = [];

        var currentQuote = null;
        $scope.quote = null;

        function setActiveTab(tab) {
            $scope.activeTab = tab;
        }
        // fetch pricing details of the partner tenant
        function fetchPricingModelDetails() {
            $http.get($config.API_ENDPOINT + 'api/partners/' + $scope.companyProfile.TenantId + '/pricingmodel', {
                    params: {
                        pricingModelId: $scope.companyProfile.PricingModelId
                    }
                })
                .success(function (response) {
                    $scope.pricingModel = response;
                    $scope.vehicleOverrides = response.VehicleTypePricings.map(function (item) {
                        item.Name = $scope.services.find(function (service) {
                            return service.VehicleTypeId == item.VehicleTypeId
                        }).VehicleTypeName
                        item._Steps = item.FarePerMileSteps ? JSON.parse(item.FarePerMileSteps) : [];
                        return item
                    })
                    $scope.steps = $scope.pricingModel.FarePerMileSteps ? JSON.parse($scope.pricingModel.FarePerMileSteps) : [];
                    $scope.peakDates = $scope.pricingModel.PeakDateBands ? JSON.parse($scope.pricingModel.PeakDateBands) : [];
                    if ($scope.peakDates) {
                        angular.forEach($scope.peakDates, function (n) {
                            n.startTime = new moment(n.start).format('HH:mm');
                            n.endTime = new moment(n.end).format('HH:mm');
                        });
                    }
                    $scope.fetching = false;
                })
                .error(function (response) {
                    $scope.fetching = false;
                    swal("Pricing Model", response.ExceptionMessage, "error")
                });
        }
        // creating polygons as per coverage area of partner to check the booking stops 
        if ($scope.coverageAreas && $scope.coverageAreas.length > 0) {
            for (i = 0; i < $scope.coverageAreas.length; i++) {
                var polygon = new google.maps.Polygon({
                    paths: google.maps.geometry.encoding.decodePath($scope.coverageAreas[i])
                });
                $scope.polygons.push(polygon);
            }
        }

        // create new booking for quote testing
        $scope.selectedBooking = new Model.Booking();
        $scope.selectedBooking.BookingStops.length = 0;
        $scope.selectedBooking.BookingStops.push(new Model.BookingStop());
        $scope.selectedBooking.BookingStops.push(new Model.BookingStop());

        $scope.selectedBooking.TaxId = $scope.companyProfile.DefaultTaxId;
        $scope.selectedBooking.VehicleTypeId = $tenantConfig.defaultVehicleType;
        $scope.selectedBooking.VehicleClassId = $tenantConfig.defaultVehicleClass;
        $scope.selectedBooking.PricingModelId = $scope.companyProfile.PricingModelId;
        $scope.selectedBooking.TenantId = $scope.companyProfile.TenantId;
        $scope.selectedBooking.Status = 'Incoming';
        $scope.selectedBooking.BookedDateTime = new moment.tz($scope.selectedBooking.Time, Localisation.timeZone().getTimeZone()).format();
        var dt = new moment.tz(Localisation.timeZone().getTimeZone());
        $scope.selectedBooking.BookedDateTime = dt.toDate();
        $scope.selectedBooking.Time = dt.startOf('minute').add(15, 'minutes').toDate();

        $scope.$watch('selectedBooking.BookingStops', function () {
            var startsInZone = true;
            var canQuote = true;
            if ($scope.polygons.length == 0) {
                canQuote = false
                return;
            } else if (!$scope.selectedBooking.BookingStops[0].Latitude || !$scope.selectedBooking.BookingStops[1].Latitude) {
                canQuote = false
            } else {
                if ($scope.selectedBooking.BookingStops[0].Latitude && $scope.selectedBooking.BookingStops[1].Latitude) {
                    startsInZone = false;
                    for (var i = 0; i < $scope.polygons.length; i++) {
                        if (google.maps.geometry.poly.containsLocation(new google.maps.LatLng($scope.selectedBooking.BookingStops[0].Latitude, $scope.selectedBooking.BookingStops[0].Longitude), $scope.polygons[i])) {
                            startsInZone = true
                            break
                        }
                        if (!google.maps.geometry.poly.containsLocation(new google.maps.LatLng($scope.selectedBooking.BookingStops[1].Latitude, $scope.selectedBooking.BookingStops[1].Longitude), $scope.polygons[i])) {
                            startsInZone = true
                            break
                        }
                    }
                }
            }
            if (!startsInZone) {
                swal("Coverage Area", "Booking stop is outside of the coverage area", "warning");
                $scope.selectedBooking.canQuote = false;
            }
            if (canQuote) {
                $scope.selectedBooking.$canQuote = true;
            }
        }, true);

        function getAllQuotes() {
            $scope.services = $scope.services.map(function (item) {
                item.$fetching = true
                return item
            })
            getQuote(0)
        }

        function getQuote(index) {
            var booking = $scope.selectedBooking;
            booking.VehicleTypeId = $scope.services[index].VehicleTypeId
            $http.post($config.API_ENDPOINT + 'api/partners/' + $scope.companyProfile.TenantId + '/quote', booking)
                .success(function (result) {
                    if (result.Error) {
                        swal("Error", result.ErrorMessage, "error");
                        return;
                    }
                    if (!$scope.distance)
                        $scope.distance = Number(result.EstimatedDistance.toFixed(1));
                    $scope.services[index].$fare = Number(result.FinalCost.toFixed(2));;
                    $scope.services[index].$fetching = false;
                    if (index < $scope.services.length - 1)
                        getQuote(index + 1)
                }).error(function (error) {
                    $scope.services[index].$fare = "Error Fetching Quote"
                    $scope.services[index].$fetching = false;
                    if (index < $scope.services.length)
                        getQuote(index + 1)
                });
        }

        function addStop() {
            var stop = new Model.BookingStop();
            $scope.selectedBooking.BookingStops.push(stop);
        }

        function getPreviousStep(step, steps) {
            var index = steps.indexOf(step);
            if (index <= 0) return 0;
            else {
                if (steps[index - 1].max >= step.max) {
                    step.max = steps[index - 1].max + 1;
                }
                return steps[index - 1].max;
            }
        }
    }
}(angular));