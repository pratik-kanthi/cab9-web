(function (angular) {
    var module = angular.module('cab9.settings');
    module.controller('SettingsPriceListController', settingsPriceListController);
    settingsPriceListController.$inject = ['$scope', '$UI', '$q', '$stateParams', 'Model', '$http', 'CSV'];

    function settingsPriceListController($scope, $UI, $q, $stateParams, Model, $http, CSV) {
        $scope.generate = generate;
        $scope.download = download;
        $scope.showTable = false;
        var totalLength = 0;
        var count = 0;
        $scope.query = {
            from: "",
            to: "",
            vehicleTypeId: "",
            bookedDateTime: moment().hour(10).minute(00)
        };
        $scope.progress = null;
        $scope.progressString = "";
        $scope.priceList = [];

        fetchVehicleTypes();
        var a;

        function fetchVehicleTypes() {
            Model.VehicleType.query().execute().then(function(response){
                $scope.vehicleTypes = response;
                $scope.query.vehicleTypeId = response[0].Id;
            })
        }

        function download() {
            CSV.download($scope.priceList.map(function (item) {
                return {
                    From: item.from,
                    To: item.to,
                    "Distance(Miles)": item.EstimatedDistance,
                    "Cost(£)": item.FinalCost,
                }
            }), 'PriceList');
        }

        function generate() {
            a = moment();
            var reqArray = [];
            $scope.priceList = [];
            $scope.showTable = true;
            $http.get('/includes/data/UkLatLng.json').then(function (response) {
                    var data = response.data;
                    var fromPostcodes = $scope.query.from.split(' ').join('').split("\n");
                    var toPostcodes = $scope.query.to.split(' ').join('').split("\n");
                    for (i = 0, len = fromPostcodes.length; i < len; i++) {
                        var from = data[fromPostcodes[i]];
                        if (!from) {
                            continue;
                        }
                        from.Postcode = fromPostcodes[i];
                        for (j = 0, len = toPostcodes.length; j < len; j++) {
                            var to = data[toPostcodes[j]];
                            if (!to) {
                                continue;
                            }
                            var obj = {
                                VehicleTypeId: $scope.query.vehicleTypeId,
                                BookedDateTime: $scope.query.bookedDateTime,
                                BookingStops: [from],
                                PricingModelId: $scope.item.Id,
                                from: fromPostcodes[i],
                                to: toPostcodes[j]
                            };
                            obj.BookingStops.push({
                                Postcode: toPostcodes[j],
                                latitude: to.latitude,
                                longitude: to.longitude
                            });
                            reqArray.push(obj);
                        }
                    }
                    $scope.progress = 0;
                    $scope.progressString = "Fetching(0/" + data.length + ")";
                    totalLength = reqArray.length;
                    count = 0;
                    $scope.progressString = "Fetching(" + count + "/" + totalLength + ")";
                    if (reqArray.length == 0)
                        return;
                    generatedata(reqArray);
                },
                function (err) {
                    swal({
                        title: "Some Error Occured.",
                        text: "Some error has occured.",
                        type: "error",
                        confirmButtonColor: $UI.COLOURS.brandSecondary
                    });
                })
        }

        function generatedata(data) {
            if (data.length == 0) {
                swal({
                    title: "Price List Fetched",
                    text: "Changes have been updated.",
                    type: "success",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
                console.log(moment().diff(a, 'seconds'));
                $scope.progress = null;
                return;
            };
            var promises = [];
            if (data.length > 1)
                promises = getData(data.splice(0, 1));
            else
                promises = getData(data.splice(0, data.length));

            $q.all(promises).then(function (results) {
                generatedata(data);
            });

            function getData(slot) {
                for (i = 0; i < slot.length; i++) {
                    var d = slot[i];
                    promises.push($http.post($config.API_ENDPOINT + 'api/quote', d).then(function (response) {
                        count++;
                        $scope.progress = count / totalLength * 100;
                        $scope.progressString = "Fetching(" + count + "/" + totalLength + ")";
                        $scope.priceList.push({
                            from: d.from,
                            to: d.to,
                            EstimatedDistance: response.data.EstimatedDistance,
                            FinalCost: response.data.FinalCost,
                            EstimatedMins: response.data.EstimatedMins
                        });
                    }, function (err) {
                        swal({
                            title: "Some Error Occured.",
                            text: "Some error has occured.",
                            type: "error",
                            confirmButtonColor: $UI.COLOURS.brandSecondary
                        });
                    }));
                };
                return promises;
            }
        }
    }
})(angular)