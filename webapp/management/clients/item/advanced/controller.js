(function (angular) {
    var module = angular.module('cab9.clients');
    module.controller('ClientItemAdvancedController', ClientItemAdvancedController);
    ClientItemAdvancedController.$inject = ['$scope', '$http', '$config', '$stateParams', '$q', 'rVehicleTypes', 'rData', 'CSV'];

    function ClientItemAdvancedController($scope, $http, $config, $stateParams, $q, rVehicleTypes, rData, CSV) {
        $scope.client = rData[0];
        $scope.view = {
            current: 'REPRICE',
            switchTo: switchTo
        };

        $scope.vehicleTypes = rVehicleTypes;

        var f = new moment().subtract(7, 'days').startOf('day').toDate();
        var t = new moment().endOf('day').startOf('second').toDate();
        $scope.repricing = {
            period: 'Last 7 Days',
            from: f,
            fromDate: f,
            fromTime: f,
            to: t,
            toDate: t,
            toTime: t,
            email: 'dbeech@e9ine.com',
            send: sendRepricing
        };

        $scope.query = {
            from: '',
            to: '',
            vehicleTypeId: $scope.vehicleTypes[0].Id,
            submit: submit,
            download: download,
            results: null,
            bookedDateTime: moment().hour(10).minute(00)
        }

        function download() {
            CSV.download($scope.query.results.map(function (item) {
                return {
                    From: item.from,
                    To: item.to,
                    "Distance (Miles)": item.EstimatedDistance,
                    "Cost (£)": item.FinalCost,
                }
            }), 'PriceList');
        }

        function submit() {
            a = moment();
            var reqArray = [];
            $scope.query.results = [];
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
                            PricingModelId: $scope.client.PricingModelId,
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
                $scope.query.progress = 0;
                $scope.query.progressString = "Fetching(0/" + data.length + ")";
                totalLength = reqArray.length;
                count = 0;
                $scope.query.progressString = "Fetching(" + count + "/" + totalLength + ")";
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
                });
                console.log(moment().diff(a, 'seconds'));
                $scope.query.progress = null;
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
                    slot[i].ClientId = $scope.client.Id;
                    var d = slot[i];
                    promises.push($http.post($config.API_ENDPOINT + 'api/quote', d).then(function (response) {
                        count++;
                        $scope.query.progress = count / totalLength * 100;
                        $scope.query.progressString = "Fetching(" + count + "/" + totalLength + ")";
                        $scope.query.results.push({
                            from: d.from,
                            to: d.to,
                            EstimatedDistance: response.data.EstimatedDistance,
                            FinalCost: response.data.FinalCost,
                            EstimatedMins: response.data.EstimatedMins
                        });
                    }));
                };
                return promises;
            }
        }


        function switchTo(view) {
            $scope.view.current = view;
        }

        $scope.openCalendar = function (event, name) {
            $scope.repricing[name] = true;
            event.preventDefault();
            event.stopPropagation();
        }

        function sendRepricing() {
            var fromDate = new moment($scope.repricing.fromDate).format('YYYY-MM-DD');
            var fromTime = new moment($scope.repricing.fromTime).format('HH:mm:ss.ssssZ');
            var from = fromDate + 'T' + fromTime;

            var toDate = new moment($scope.repricing.toDate).format('YYYY-MM-DD');
            var toTime = new moment($scope.repricing.toTime).format('HH:mm:ss.sssZ');
            var to = toDate + 'T' + toTime;

            $http.post($config.API_ENDPOINT + 'api/client/reprice', {                
                    from: from,
                    to: to,
                    email: $scope.repricing.email,
                    clientId: $stateParams.Id
            }).success(function () {
                swal('Repricing Queued', 'Repricing has been queued, you will receive an email when completed', 'success');
                })
        }
    }
})(angular)
