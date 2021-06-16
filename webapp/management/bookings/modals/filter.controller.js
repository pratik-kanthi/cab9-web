(function (angular) {

    var module = angular.module('cab9.bookings');
    module.controller('BookingsFilterModalController', bookingsFilterModalController);
    bookingsFilterModalController.$inject = ['$scope', 'rFilter', '$modalInstance', 'Model', '$http'];

    function bookingsFilterModalController($scope, rFilter, $modalInstance, Model, $http) {
        $scope.filterOptions = angular.copy(rFilter);
        $scope.clients = $scope.filterOptions.Clients;
        $scope.worksharePartners = $scope.filterOptions.Partners;
        $scope.vehicleTypes = $scope.filterOptions.VehicleTypes;
        $scope.drivers = $scope.filterOptions.Drivers;
        $scope.passengers = $scope.filterOptions.Passengers;
        $scope.searchPartners = searchPartners;
        Model.VehicleType
            .query()
            .select('Id,Name,Description')
            .execute().then(function (data) {
                $scope.vehicleTypes = data;
            });


        $scope.status = {};
        $scope.bookingSources = [{
                Id: 'APP',
                Name: 'Mobile App',
                Description: ''
            },
            {
                Id: 'WEB',
                Name: 'Web Application',
                Description: ''
            },
            {
                Id: 'PHONE',
                Name: 'Phone',
                Description: ''
            },
            {
                Id: 'OTHER',
                Name: 'Other',
                Description: ''
            },
            {
                Id: 'ONETRANSPORT',
                Name: 'One Transport',
                Description: ''
            },
            {
                Id: 'CLIENT_PORTAL',
                Name: 'Client Portal',
                Description: ''
            },
            {
                Id: 'IMPORTED',
                Name: 'Imported',
                Description: ''
            },
            {
                Id: 'MORGAN_STANLEY',
                Name: 'Morgan Stanley',
                Description: ''
            },
            {
                Id: 'INFI9NITY',
                Name: 'Infi9nty',
                Description: ''
            },
            {
                Id: 'GROUNDSCOPE',
                Name: 'Ground Scope',
                Description: ''
            },
            {
                Id: 'HEREMaps',
                Name: 'HERE Maps',
                Description: ''
            },
            {
                Id: 'GETT',
                Name: 'Gett',
                Description: ''
            },
            {
                Id: 'CITYFLEET',
                Name: 'City Fleet',
                Description: ''
            }
        ];

        $scope.paymentMethods = [{
                Id: 'CASH',
                Name: 'Cash',
                Description: ''
            },
            {
                Id: 'CARD',
                Name: 'Card',
                Description: ''
            },
            {
                Id: 'ONACCOUNT',
                Name: 'OnAccount',
                Description: ''
            },
            {
                Id: 'OTHER',
                Name: 'Other',
                Description: ''
            }
        ];

        $scope.partnerTypes = [{
                Id: 'GETT',
                Name: 'GETT',
                Description: ''
            },
            {
                Id: 'CITYFLEET',
                Name: 'CITYFLEET',
                Description: ''
            },
            {
                Id: 'CAB9',
                Name: 'CAB9',
                Description: ''
            },
        ];

        setTimeout(function () {
            $('#daterangepicker_bookings').daterangepicker({
                locale: {
                    format: 'DD/MM/YYYY'
                },
                "autoApply": true,
                "startDate": moment($scope.filterOptions.date.from).startOf('day'),
                "endDate": moment($scope.filterOptions.date.to).endOf("day"),
                "opens": "right",
                "parentEl": "#time-controls",
                ranges: {
                    'Today': [moment().startOf("day"), moment().endOf("day")],
                    'This Week': [moment().startOf('isoweek'), moment().endOf('isoweek')],
                    'This Month': [moment().startOf('month'), moment().endOf('month')]
                },
                "alwaysShowCalendars": true,
            });

            $('#daterangepicker_bookings').on('apply.daterangepicker', function (ev, picker) {
                $scope.filterOptions.date.selectedPeriod = picker.chosenLabel;
                $scope.filterOptions.date.from = picker.startDate.toISOString();
                $scope.filterOptions.date.to = picker.endDate.toISOString();
                if ($scope.filterOptions.date.selectedPeriod == "Custom Range") {
                    $scope.filterOptions.date.selectedPeriod = " (" + moment($scope.filterOptions.date.from).format('DD/MM/YYYY') + " - " + moment($scope.filterOptions.date.to).format('DD/MM/YYYY') + ")";
                }
                $scope.$apply();
            });
        }, 100)

        $scope.datePickers = {
            from: false,
            to: false
        }

        $scope.openDatePicker = function ($event, type) {
            $scope.datePickers[type] = !$scope.datePickers[type];
            event.preventDefault();
            event.stopPropagation();
        }

        var initial = true;
        $scope.$watchCollection('filterOptions.ClientIds', function (newvalues) {
            if (initial)
                initial = false;
            else {
                $scope.passengers = [];
                $scope.filterOptions.LeadPassengerIds = [];
            }
            // if (newvalues.length == 1) {
            //     Model.Passenger.query().select('Id', 'Firstname', 'Surname').where('ClientId', 'eq', "guid'" + newvalue + "'").execute().then(function(data) {
            //         $scope.passengers = data;
            //     })
            // }
        });

        $scope.searchClients = searchClients;
        $scope.searchDrivers = searchDrivers;
        $scope.searchPassengers = searchPassengers;
        $scope.saveSelected = saveSelected;
        $scope.confirmFilters = confirmFilters;


        function saveSelected(selected, filter) {
            $scope.filterOptions[filter] = selected;
        }

        function searchClients(searchText) {
            if (!searchText)
                return;
            $scope.loadingClients = true;
            $http.get($config.API_ENDPOINT + "api/Clients/Search", {
                params: {
                    searchText: searchText,
                    lite: true
                }
            }).then(function (response) {
                $scope.clients = [];
                for (var i = 0; i < response.data.length; i++) {
                    var item = response.data[i];
                    if ($scope.filterOptions.ClientIds.indexOf(item.Id) == -1)
                        $scope.clients.push({
                            Id: item.Id,
                            Name: "(" + item.AccountNo + ") " + item.Name,
                            Description: ((item.ClientType && item.ClientType.Name) ? item.ClientType.Name : ''),
                        });
                }
                $scope.loadingClients = false;

            });
        }

        function searchDrivers(searchText) {
            if (!searchText)
                return;
            $scope.loadingDrivers = true;
            $http.get($config.API_ENDPOINT + "api/Drivers/Search", {
                params: {
                    searchText: searchText,
                    lite: true
                }
            }).then(function (response) {
                $scope.drivers = [];
                for (var i = 0; i < response.data.length; i++) {
                    var item = response.data[i];
                    if ($scope.filterOptions.DriverIds.indexOf(item.Id) == -1)
                        $scope.drivers.push({
                            Id: item.Id,
                            Name: item.Firstname + ' ' + item.Surname + ' (' + item.Callsign + ')',
                            Description: item.DriverType.Name
                        });
                }
                $scope.loadingDrivers = false;
            });
        }

        function searchPartners(searchText) {
            if (!searchText)
                return;
            $scope.loadingPartners = true;
            $http.get($config.API_ENDPOINT + "api/partners/search", {
                params: {
                    searchText: searchText,
                    lite: true
                }
            }).then(function (response) {
                $scope.worksharePartners = [];
                for (var i = 0; i < response.data.length; i++) {
                    var item = response.data[i];
                    if ($scope.filterOptions.PartnerIds.indexOf(item.Id) == -1)
                        $scope.worksharePartners.push({
                            Id: item.Id,
                            Name: item.PartnerName
                        });
                }
                $scope.loadingPartners = false;
            });
        }

        function searchPassengers(searchText) {
            if (!searchText)
                return;
            $scope.loadingPassengers = true;
            $http.get($config.API_ENDPOINT + "api/Passengers/Search", {
                params: {
                    searchText: searchText,
                    clientId: $scope.filterOptions.ClientIds[0],
                    lite: true
                }
            }).then(function (response) {
                $scope.passengers = [];
                for (var i = 0; i < response.data.length; i++) {
                    var item = response.data[i];
                    if ($scope.filterOptions.LeadPassengerIds.indexOf(item.Id) == -1)
                        $scope.passengers.push({
                            Id: item.Id,
                            Firstname: item.Firstname,
                            Surname: item.Surname
                        });
                }
                $scope.loadingPassengers = false;
            });
        }

        function confirmFilters() {
            $modalInstance.close($scope.filterOptions);
        }
    }

})(angular);