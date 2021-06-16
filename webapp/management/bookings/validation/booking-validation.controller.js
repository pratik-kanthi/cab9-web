(function(angular) {

    var module = angular.module('cab9.bookings');
    module.controller('BookingValidationController', bookingValidationController);
    bookingValidationController.$inject = ['$scope', '$state', '$modal', '$http', '$filter', 'Model', '$timeout', '$UI', 'rVehicleTypes'];

    function bookingValidationController($scope, $state, $modal, $http, $filter, Model, $timeout, $UI, rVehicleTypes) {

        //Page Variables
        $scope.vehicleTypes = rVehicleTypes;

        $scope.fetchedDrivers = [];
        $scope.fetchedClients = [];
        $scope.fetchedPassengers = [];
        $scope.opened = {};

        //Page Functions
        $scope.setPage = setPage;
        $scope.openCalendar = openCalendar;
        $scope.setupPageDefaults = setupPageDefaults;
        $scope.searchClients = searchClients;
        $scope.searchDrivers = searchDrivers;
        $scope.searchPassengers = searchPassengers;
        $scope.setValidFilter = setValidFilter;
        $scope.sortResult = sortResult;
        $scope.currentFilter = currentFilter;

        setupPageDefaults();


        function setupPageDefaults() {
            $scope.paging = {
                currentPage: 1,
                resultsPerPage: 20,
                totalResults: null,
                maxPages: null,
                loading: true
            };
            $scope.filters = {
                From: moment().subtract(7, "days").startOf("isoweek").format("YYYY-MM-DD"),
                To: moment().subtract(7, "days").endOf("isoweek").format("YYYY-MM-DD"),
                DriverIds: [],
                ClientIds: [],
                PassengerIds: [],
                VehicleTypeIds: [],
                ClientStaffIds: [],
                PaymentMethods: [],
                BookingSources: [],
                Top: 20,
                Skip: 0,
                MinCost: null,
                MaxCost: null,
                MinProfit: null,
                MaxProfit: null,
                SortBy: 'BookedDateTime',
                SearchTerm: null,
                ValidFilter: 'NON',
                NonDispute: false
            };

            $scope.paymentTypes = [];
            new Model.Booking().$$schema.PaymentMethod.enum.forEach(function(item, index) {
                $scope.paymentTypes.push({
                    Id: index,
                    Name: item
                });
            });

            $scope.bookingSources = [];
            new Model.Booking().$$schema.BookingSource.enum.forEach(function(item, index) {
                $scope.bookingSources.push({
                    Id: index,
                    Name: item
                });
            });

            setPage(1);
        }

        function currentFilter() {
            var obj = {};
            var fA = $scope.filters.SortBy.split(" ");
            obj.Filter = fA[0];
            if(fA.length > 1) {
                obj.Desc = true;
            }
            return obj;

        }

        function setValidFilter(filterStatus) {
            $scope.filters.ValidFilter =  filterStatus;
            setPage(1);
        }

        function sortResult(sortParam) {
            $scope.filters.SortBy =  sortParam;
            setPage(1);
            $scope.showSort = false;
        }


        function setPage(page) {
            $scope.paging.loading = true;

            $scope.paging.currentPage = page;
            $scope.filters.Skip = $scope.paging.resultsPerPage * ($scope.paging.currentPage - 1)
            var filterObj = angular.copy($scope.filters);
            var filterStrings = ["DriverIds", "ClientIds","VehicleTypeIds","ClientStaffIds","PassengerIds","PaymentMethods","BookingSources"];

            filterStrings.map(function(fs) {
                if(filterObj[fs].length > 0) {
                    filterObj[fs].map(function(item, index){
                        filterObj[fs][index] = _addQuotes(item);
                    });
                    filterObj[fs] = filterObj[fs].join(",");
                }
            });
            $http.get($config.API_ENDPOINT + 'api/bookings/validation/fetch', {
                params: filterObj
            }).success(function(data) {
                $scope.paging.loading = false;
                $scope.paging.totalResults = data.Stats.Bookings;
                $scope.paging.maxPages = Math.ceil($scope.paging.totalResults / $scope.paging.resultsPerPage);
                data.Bookings.map(function(b) {
                    if(b.Profit) {
                        b.Profit = b.Profit.toFixed(2);
                    } 
                    if(b.PaymentMethod == "Cash") {
                        b.$invLbl = "Cash";
                    } else if(b.PaymentMethod == "Card") {
                        b.$invLbl = "Card";
                    } else {
                        b.$invLbl = "Invoice";
                    }
                });
                $scope.bookings = data.Bookings;
                $scope.stats = data.Stats;
            }).error(function(error) {
                $scope.paging.loading = false;
                swal("Error", error.Message, "error");
            });

        }

        
        function openCalendar(event, name) {
            $scope.opened[name] = true;
            event.preventDefault();
            event.stopPropagation();
        }

        function searchDrivers(searchText) {
            $scope.fetchedDrivers.length = 0;
            if (searchText)
                Model.Driver
                .query()
                .where("substringof('" + searchText + "', concat(concat(Firstname, ' '), Surname)) or substringof('" + searchText + "', Callsign)")
                .select('Id,Firstname,Surname,Callsign,DriverType/Name')
                .include('DriverType')
                .parseAs(function(item) {
                    this.Id = item.Id;
                    this.Name = '(' + item.Callsign + ') ' + item.Firstname + ' ' + item.Surname;
                    this.Description = (item.DriverType && item.DriverType.Name);
                    this.Callsign = item.Callsign;
                })
                .top(10)
                .execute().then(function(data) {
                    [].push.apply($scope.fetchedDrivers, data);
                });
        }

        function searchClients(searchText) {
            $scope.fetchedClients.length = 0;
            if (searchText)
                Model.Client
                .query()
                .where("substringof('" + searchText + "', Name) or substringof('" + searchText + "', AccountNo)")
                .select('Id,AccountNo,Name, ClientType/Name')
                .include('ClientType')
                .parseAs(function(item) {
                    this.Id = item.Id;
                    this.Name = '(' + item.AccountNo + ') ' + item.Name;
                    this.Description = (item.ClientType && item.ClientType.Name);
                    this.AccountNo = item.AccountNo;
                })
                .top(10)
                .execute().then(function(data) {
                    [].push.apply($scope.fetchedClients, data);
                });
        }

        function searchPassengers(searchText) {
            $scope.fetchedPassengers.length = 0;
            if (searchText)
                Model.Passenger
                .query()
                .where("substringof('" + searchText + "', concat(concat(Firstname, ' '), Surname))")
                .select('Id,Firstname,Surname,Client/Name')
                .include('Client')
                .top(10)
                .parseAs(function(item) {
                    this.Id = item.Id;
                    this.Name = item.Firstname + ' ' + item.Surname;
                    this.Description = (item.Client && item.Client.Name);
                    this.Firstname = item.Firstname;
                })
                .execute().then(function(data) {
                    [].push.apply($scope.fetchedPassengers, data);
                });
        }

        function _addQuotes(str) {
            return "'" + str + "'";
        }
    }

})(angular);