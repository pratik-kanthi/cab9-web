(function (window, angular) {
    var app = angular.module("cab9.layout");

    app.controller('QuickNavController', quickNavController);

    quickNavController.$inject = ['$scope', '$rootScope', '$http', '$config', '$state', 'Model'];
    
    function quickNavController($scope, $rootScope, $http, $config, $state, Model) {
        $scope.quickNavigateRemove = quickNavigateRemove;
        $scope.searchValue = '';
        $scope.searching = false;
        $scope.results = null;
        $scope.choosen = {
            group: null
        }
        $scope.groups = {};
        $scope.visibleResults = [];
        $scope.localResults = [];
        $scope.chose = function (item) {
            $scope.choosen.item = item;
            if (item.$data) return;
            if (item.Type == 'Driver') {
                Model.Driver.query()
                    .where('Id', 'eq', "guid'" + item.Id + "'")
                    .select('Id, Firstname, Surname, Callsign, Mobile, Email, Address1, Area, TownCity, County, Postcode, ScoreOverall, ImageUrl')
                    .execute()
                    .then(function (data) {
                        item.$data = data[0];
                    });
            }
            else if (item.Type == 'Client') {
                Model.Client.query()
                    .where('Id', 'eq', "guid'" + item.Id + "'")
                    .select('Id, Name, AccountNo, Phone, Email, Address1, Area, TownCity, County, Postcode, ScoreOverall, ImageUrl')
                    .execute()
                    .then(function (data) {
                        item.$data = data[0];
                    });
            } else if (item.Type == 'ClientStaff') {
                Model.ClientStaff.query()
                    .where('Id', 'eq', "guid'" + item.Id + "'")
                    .select('Id, Firstname, Surname, Client/Name, Mobile, Email, ClientId, ImageUrl')
                    .include('Client')
                    .execute()
                    .then(function (data) {
                        item.$data = data[0];
                    });
            } else if (item.Type == 'Passenger') {
                Model.Passenger.query()
                    .where('Id', 'eq', "guid'" + item.Id + "'")
                    .select('Id, Firstname, Surname, Client/Name, Mobile, Email, Addresses, ScoreOverall, ImageUrl')
                    .include('Client')
                    .include('Addresses')
                    .execute()
                    .then(function (data) {
                        item.$data = data[0];
                    });
            } else if (item.Type == 'Vehicle') {
                Model.Vehicle.query()
                    .where('Id', 'eq', "guid'" + item.Id + "'")
                    .select('Id, Registration, Type/Name, Driver/Firstname, Driver/Surname, Driver/Callsign, Make, Model, Colour, RegYear, ScoreOverall, ImageUrl')
                    .include('Type')
                    .include('Driver')
                    .execute()
                    .then(function (data) {
                        item.$data = data[0];
                    });
            } else if (item.Type == 'Booking') {
                Model.Booking.query()
                    .where('Id', 'eq', "guid'" + item.Id + "'")
                    .select('Id, LocalId, ClientId, BookingStatus, BookedDateTime, EstimatedDistance, Client/Name, Client/AccountNo, LeadPassenger/Firstname, LeadPassenger/Surname, BookingStops/StopOrder, BookingStops/StopSummary, ImageUrl')
                    .include('LeadPassenger')
                    .include('Client')
                    .include('BookingStops')
                    .execute()
                    .then(function (data) {
                        item.$data = data[0];
                    });
            } else if (item.Type == 'Invoice') {
                Model.Invoice.query()
                    .where('Id', 'eq', "guid'" + item.Id + "'")
                    //.select('Id, ClientName, ClientId, BookingStatus, BookedDateTime, EstimatedDistance, Client/Name, Client/AccountNo, LeadPassenger/Firstname, LeadPassenger/Surname, BookingStops/StopOrder, BookingStops/StopSummary, ImageUrl')
                    .include('Client')
                    .execute()
                    .then(function (data) {
                        item.$data = data[0];
                    });
            }
        }

        $scope.openBooking = function (booking) {
            window.open('/webapp/common/modals/bookings/edit-booking/window.html#?id=' + booking.Id + '&clientId=' + booking.$data.ClientId, 'EDIT:' + booking.Id, 'height=870,width=1000,left=0,top=0');
        }

        function quickNavigateRemove() {
            $rootScope.showQuickNav = false;
            $(document).off('keyup', onEscape);
        }

        $scope.$watch('choosen.group', function(newvalue) {
                if (newvalue) {
                    $scope.visibleResults = $scope.groups[newvalue];
                } else {
                    $scope.visibleResults = $scope.results;
                }

        });

        $scope.getScoreClass = function (score) {
            if (score >= 4) {
                return 'text-success';
            } else if (score >= 2.5) {
                return 'text-warning';
            } else {
                return 'text-danger';
            }
        }

        $scope.formatImage = function (item) {
            if (!item) return;
            var imageUrl = item.$data ? item.$data.ImageUrl : item.ImageUrl;
            var name = "";
            if (item.Type == 'Vehicle') {
                name = item.$data ? item.$data.Registration : item.Name;
            } else if (item.Type == 'Driver') {
                name = item.$data ? item.$data.Callsign : item.Name;
            } else if (item.Type == 'Client') {
                name = item.$data ? item.$data.AccountNo : item.Name;
            } else if (item.Type == 'Passenger') {
                name = item.$data ? item.$data.Firstname : item.Name;
            } else if (item.Type == 'ClientStaff') {
                name = item.$data ? item.$data.Firstname : item.Name;
            } else if (item.Type == 'Booking') {
                name = item.$data ? item.$data.LocalId : item.Name;
            } else if (item.Type == 'Invoice') {
                name = item.$data ? item.$data.Reference : item.Name;
            }
            if (imageUrl) {
                if (imageUrl.slice(0, 4) == 'http') {
                    return imageUrl;
                } else {
                    return ($config.RESOURCE_ENDPOINT || $config.API_ENDPOINT) + imageUrl;
                }
            } else if (name) {
                var n = name;
                var spaceIndex = name.indexOf(' ');
                if (spaceIndex != -1) {
                    n = name.substring(0, spaceIndex);
                }
                return $config.API_ENDPOINT + 'api/imagegen?text=' + n;
            }
        }

        $scope.goTo = function (item) {
            $state.go(item.state);
        }

        $scope.$watch('searchValue', function (newvalue) {
            $scope.results = null;
            $scope.groups = {};
            $scope.choosen.group = null;
            $scope.visibleResults = [];
            $scope.localResults = [];
            if (newvalue && newvalue.length > 2) {
                $scope.searching = true;
                $http.get($config.API_ENDPOINT + 'api/globalsearch?searchtext=' + encodeURIComponent(newvalue))
                    .success(function (data) {
                        $scope.visibleResults = $scope.results = data;
                        $scope.groups = {};

                        for (var i = 0; i < data.length; i++) {
                            var item = data[i];
                            var group = item.Type;
                            if (!$scope.groups[group]) {
                                $scope.groups[group] = [];
                                $scope.groups[group].limit = 6;
                            }
                            $scope.groups[group].push(item);
                        }

                        $scope.searching = false;
                    });

                var states = $state.get();
                for (var i = 0; i < states.length; i++) {
                    var state = states[i];
                    var search = state.searchText;
                    if (search && search.indexOf(newvalue.toLowerCase()) >= 0) {
                        $scope.localResults.push({
                            icon: state.searchIcon,
                            name: state.searchName,
                            state: state.default || state.name,
                            Type: 'Local'
                        });
                    }
                }
            }
        });

        $rootScope.$watch('showQuickNav', function (newvalue) {
            if (newvalue) {
                setTimeout(function () {
                    $('#search-box').focus();
                    $(document).on('keyup', onEscape);
                }, 100);
            }
        })

        function onEscape(e) {
            if (e.keyCode == 27) { // escape key maps to keycode `27`
                $rootScope.showQuickNav = false;
                $rootScope.$apply();
            }
        }
    };

})(window, angular);
