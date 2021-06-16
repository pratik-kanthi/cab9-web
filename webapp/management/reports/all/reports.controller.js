(function () {
    var module = angular.module('cab9.report');

    module.controller('ReportsController', ReportsController);

    ReportsController.$inject = ['$scope', 'rDrivers', 'rClients', 'rPassengers', 'rCurrencies', 'rVehicleTypes', 'rVehicleClasses', 'Model', '$rootScope', 'reports', 'Auth'];

    function ReportsController($scope, rDrivers, rClients, rPassengers, rCurrencies, rVehicleTypes, rVehicleClasses, Model, $rootScope, reports, Auth) {
        $scope.drivers = rDrivers;
        $scope.clients = rClients;
        $scope.passengers = rPassengers;
        $scope.currencies = rCurrencies;
        $scope.vehicleTypes = rVehicleTypes;
        $scope.vehicleClasses = rVehicleClasses;
        $scope.printReport = printReport;

        $scope.paymentTypes = [];
        new Model.Booking().$$schema.PaymentMethod.enum.forEach(function (item, index) {
            $scope.paymentTypes.push({
                Id: index,
                Name: item
            });
        });
        $scope.bookingSources = [];
        new Model.Booking().$$schema.BookingSource.enum.forEach(function (item, index) {
            $scope.bookingSources.push({
                Id: index,
                Name: item
            });
        })

        $scope.opened = {};
        $rootScope.filters.From = moment().subtract(30, 'days').format("YYYY-MM-DD");
        $rootScope.filters.To = moment().subtract(1, 'days').format("YYYY-MM-DD");

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

        $scope.fetchedDrivers = [];
        $scope.searchDrivers = searchDrivers;
        function searchDrivers(searchText) {
            $scope.fetchedDrivers.length = 0;
            if (searchText)
                Model.Driver
                    .query()
                    .where("substringof('" + searchText + "', concat(concat(Firstname, ' '), Surname)) or substringof('" + searchText + "', Callsign)")
                    .select('Id,Firstname,Surname,Callsign,ImageUrl,DriverType')
                    .include('DriverType')
                    .parseAs(function (item) {
                        this.Id = item.Id;
                        this.Name = item.Firstname + ' ' + item.Surname + ' (' + item.Callsign + ')';
                        this.Description = item.DriverType.Name;
                        this.ImageUrl = window.formatImage(item.ImageUrl, item.Callsign);
                    })
                    .execute().then(function (data) {
                        [].push.apply($scope.fetchedDrivers, data);
                    });
        }

        $scope.fetchedClients = [];
        $scope.searchClients = searchClients;
        function searchClients(searchText) {
            $scope.fetchedClients.length = 0;
            if (searchText)
                Model.Client
                    .query()
                    .where("substringof('" + searchText + "', Name) or substringof('" + searchText + "', AccountNo)")
                    .select('Id,AccountNo,Name,ImageUrl,ClientType/Name')
                    .include('ClientType')
                    .parseAs(function (data) {
                        this.Id = data.Id;
                        this.Name = data.Name + "(" + data.AccountNo + ")";
                        this.Description = data.ClientType.Name;
                        this.ImageUrl = window.formatImage(data.ImageUrl, data.Name);
                    })
                    .execute().then(function (data) {
                        [].push.apply($scope.fetchedClients, data);
                    });
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
                            if (property == "DriverIds" || property == "ClientIds" || property == "PassengerIds" || property == "VehicleTypeIds" || property == "VehicleClassIds" || property == "CurrencyIds")
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
            currentRequest = window.open($config.API_ENDPOINT + 'api/reports/excel?TenantId=' + session.TenantId + '&' + query);
        }
    }
}())