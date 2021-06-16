(function () {
    var module = angular.module('cab9.client.report');

    module.controller('ReportsController', ReportsController);

    ReportsController.$inject = ['$scope', 'rPassengers', 'rVehicleTypes', 'Model', '$rootScope', 'reports', 'Auth'];

    function ReportsController($scope, rPassengers, rVehicleTypes, Model, $rootScope, reports, Auth) {
        $scope.passengers = rPassengers;
        $scope.vehicleTypes = rVehicleTypes;
        $scope.printReport = printReport;

        $scope.opened = {};
        $rootScope.filters.From = moment().subtract(30, 'days').format("YYYY-MM-DD");
        $rootScope.filters.To = moment().subtract(1, 'days').format("YYYY-MM-DD");
        $rootScope.filters.ClientId = $scope.CLIENTID;
        $rootScope.filters.ClientIds = [$scope.CLIENTID];

        $scope.PeriodLength = [{
            id: 'dd',
            value: 'Days'
        }, {
            id: 'ww',
            value: 'Week'
        }, {
            id: 'mm',
            value: 'Months'
        }, {
            id: 'qq',
            value: 'Quarters'
        }, {
            id: 'yy',
            value: 'Years'
        }];

        $scope.openCalendar = function (event, name) {
            $scope.opened[name] = true;
            event.preventDefault();
            event.stopPropagation();
        }

        $scope.fetchData = function () {
            $scope.fetched = true;
            $rootScope.$broadcast('fetchData');
        }

        $scope.fetchedPassengers = [];
        $scope.searchPassengers = searchPassengers;
        function searchPassengers(searchText) {
            $scope.fetchedPassengers.length = 0;
            if (searchText)
                Model.Passenger
                    .query()
                    .include('Client')
                    .where("substringof('" + searchText + "', concat(concat(Firstname, ' '), Surname))")
                    .where("ClientId eq guid'" + $scope.CLIENTID + "'")
                    .select('Id,Firstname,Surname,Client/Name')
                    .top(50)
                    .parseAs(function (item) {
                        this.Id = item.Id;
                        this.Name = item.Firstname + ' ' + item.Surname;
                        this.Description = (item.Client && item.Client.Name);
                        this.ImageUrl = window.formatImage(item.ImageUrl, item.Firstname);
                    })
                    .execute().then(function (data) {
                        [].push.apply($scope.fetchedPassengers, data);
                    });
        }

        function printReport() {
            var filters = "";
            for (var property in $rootScope.filters) {
                if ($rootScope.filters.hasOwnProperty(property))
                    if ($rootScope.filters[property]) {
                        if (property == 'From' || property == 'To')
                            filters += '&' + property + '=' + $rootScope.filters[property];
                        else if ($rootScope.filters[property].length > 0) {
                            if (property == "PassengerIds" || property == "VehicleTypeIds")
                                filters += '&' + property + '=' + $rootScope.filters[property].map(function (item) {
                                    return "'" + item.replace(/ /g, '') + "'"
                                }) + '&'
                            else
                                filters += property + '=' + $rootScope.filters[property] + '&'
                        }
                    }
            }
            window.open('/print-reports.html#?t=' + $rootScope.$$access_token + filters, '_blank', 'width=600,height=800;');
        }
        
        $scope.downloadExcel = downloadExcel;
        function downloadExcel() {
            var query = reports.getQuery();
            query = query.substr(0, query.length - 1);
            console.log(query);
            var session = Auth.getSession();
            currentRequest = window.open($config.API_ENDPOINT + 'api/reports/excel?ClientReport=true&TenantId=' + session.TenantId + '&' + query);
        }
    }
}())