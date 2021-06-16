(function(angular) {
    var module = angular.module('cab9.client.bookings', []);

    module.config(moduleConfig);
    module.run(moduleRun);

    moduleConfig.$inject = ['$stateProvider', 'MenuServiceProvider', '$urlRouterProvider', '$permissions'];

    function moduleConfig($stateProvider, MenuServiceProvider, $urlRouterProvider, $permissions) {
        if (!$permissions.test('bookings')) return;
        $stateProvider.state('root.bookings', {
            url: '/bookings',
            permission: 'Bookings Module',
            views: {
                'content-wrapper@root': {
                    controller: 'BookingsTableController',
                    templateUrl: '/webapp/client/bookings/bookings-table.partial.html',
                    resolve: {
                        rDrivers: ['Model', '$rootScope', function(Model, $rootScope) {
                            return Model.Driver
                                .query()
                                .select('Id,Firstname,Surname,Callsign,ImageUrl,Vehicles/Id,Vehicles/Registration')
                                .include('Vehicles')
                                .parseAs(function(item) {
                                    this.Id = item.Id;
                                    this.Name = '(' + item.Callsign + ') ' + item.Firstname + ' ' + item.Surname;
                                    if (item.Vehicles && item.Vehicles[0]) {
                                        this.DefaultVehicleId = item.Vehicles[0].Id;
                                        this.Description = item.Vehicles[0].Registration;
                                    } else {
                                        this.DefaultVehicleId = null;
                                        this.Description = 'No Vehicle';
                                    }
                                })
                                .execute();
                        }],
                        rAllowedPassengers: ['Model', 'Auth', function (Model, Auth) {
                            return Model.ClientStaff.query().include('Passengers').select('Passengers/Id,AllPassengers').where("Id eq guid'" + Auth.getSession().Claims.ClientStaffId[0] + "'").execute();
                        }]
                    }
                }

            }

        });

        if ($permissions.test('bookings', 'W')) {
            $stateProvider.state('root.bookings.create', {
                url: '/create',
                views: {
                    'content-wrapper@root': {
                        controller: 'ClientBookingCreateController',
                        templateUrl: '/webapp/client/bookings/new/partial.html',
                        resolve: {
                            rTags: ['Model', 'Auth',
                                function (Model, Auth) {
                                    return Model.Tag
                                        .query()
                                        .filter("TenantId eq guid'" + Auth.getSession().TenantId + "'")
                                        .filter("ClientVisible eq true")
                                        .execute();
                                }
                            ]
                        }
                    }
                }
            });

        }

        $stateProvider.state('root.bookings.search', {
            url: '/:localId',
            views: {
                'content-wrapper@root': {
                    controller: 'BookingsTableController',
                    templateUrl: '/webapp/client/bookings/bookings-table.partial.html',
                    resolve: {
                        rDrivers: ['Model', function (Model) {
                            return Model.Driver
                                .query()
                                .select('Id,Firstname,Surname,Callsign,ImageUrl,Vehicles/Id,Vehicles/Registration')
                                .include('Vehicles')
                                .parseAs(function (item) {
                                    console.log(item);

                                    this.Id = item.Id;
                                    this.Name = '(' + item.Callsign + ') ' + item.Firstname + ' ' + item.Surname;
                                    if (item.Vehicles && item.Vehicles[0]) {
                                        this.DefaultVehicleId = item.Vehicles[0].Id;
                                        this.Description = item.Vehicles[0].Registration;
                                    } else {
                                        this.DefaultVehicleId = null;
                                        this.Description = 'No Vehicle';
                                    }
                                })
                                .execute();
                        }]
                    }
                }
            }
        });
        


        if ($permissions.test('bookings.viewer')) {
            $stateProvider.state('root.bookings.viewer', {
                url: '/:Id',
                default: 'root.bookings.viewer.details',
                permission: 'View Bookings',
                resolve: {
                    rBooking: ['Model', '$stateParams', function(Model, $stateParams) {
                        return Model.Booking
                            .query()
                            .filter('Id', '==', "guid'" + $stateParams.Id + "'")
                            .include('Driver,Client,Vehicle,BookingStops,BookingStops/PassengerStops,Passengers,LeadPassenger,Currency,BookingRequirements,Notifications')
                            .trackingEnabled()
                            .execute()
                            .then(function(data) {
                                return data[0];
                            });
                    }],
                    rClients: ['Model', function(Model) {
                        return Model.Client
                            .query()
                            .select('Id,Name,ImageUrl,ClientType/Name, DefaultCurrencyId')
                            .include('ClientType')
                            .parseAs(function(data) {
                                this.Id = data.Id;
                                this.Name = data.Name;
                                this.Description = data.ClientType.Name;
                                this.ImageUrl = window.formatImage(data.ImageUrl, data.Name);
                                this.DefaultCurrencyId = data.DefaultCurrencyId;
                            })
                            .execute();
                    }],
                    rVehicleTypes: ['Model', function(Model) {
                        return Model.VehicleType.query().select('Id,Name').execute();
                    }],
                    rVehicleClasses: ['Model', function(Model) {
                        return Model.VehicleClass.query().select('Id,Name').execute();
                    }],
                    rDrivers: ['Model', function(Model) {
                        return Model.Driver
                            .query()
                            .select('Id,Firstname,Surname,Callsign,ImageUrl,DriverType/Name')
                            .include('DriverType')
                            .parseAs(function(item) {
                                this.Id = item.Id;
                                this.Name = item.Firstname + ' ' + item.Surname + ' (' + item.Callsign + ')';
                                this.Description = item.DriverType.Name;
                                this.ImageUrl = window.formatImage(item.ImageUrl, item.Callsign);
                            })
                            .execute();
                    }],
                    rVehicles: ['Model', function(Model) {
                        return Model.Vehicle
                            .query()
                            .select('Id,Registration,Colour,Make,Model,Class,Type')
                            .include('Class,Type')
                            .parseAs(function(item) {
                                this.Id = item.Id;
                                this.Name = item.Registration;
                                this.Description = item.Colour + ' ' + item.Make + ' ' + item.Model;
                                this.DriverId = item.DriverId;
                                this.ImageUrl = window.formatImage(item.ImageUrl, item.Registration);
                            })
                            .execute();
                    }],
                    rPassengers: ['Model', function(Model) {
                        return Model.Passenger
                            .query()
                            .select('Id,Firstname,Surname,ClientId,ImageUrl,Client/Name')
                            .include('Client')
                            .parseAs(function(item) {
                                this.Id = item.Id;
                                this.Name = item.Firstname + ' ' + item.Surname;
                                this.Description = (item.Mobile) ? item.Mobile : 'No Mobile';
                                this.ClientId = item.ClientId;
                                this.ImageUrl = window.formatImage(item.ImageUrl, item.Firstname);
                            })
                            .execute();
                    }],
                    rTabs: function() {
                        return [{
                            heading: 'Details',
                            route: 'root.bookings.viewer.details'
                        }];
                    },
                    rTaxes: ['Model', function(Model) {
                        return Model.Tax
                            .query()
                            .include('TaxType')
                            .execute();
                    }]
                },
                views: {
                    'content-wrapper@root': {
                        controller: 'BookingsViewerController',
                        templateUrl: '/webapp/client/bookings/bookings-viewer.partial.html'
                    }
                }
            });

            $stateProvider.state('root.bookings.viewer.details', {
                url: '/details',
                templateUrl: '/webapp/client/bookings/edit/booking-edit.partial.html',
                controller: 'BookingEditController'
            });
        }


        MenuServiceProvider.registerMenuItem({
            state: 'root.bookings',
            icon: 'event_note',
            title: 'Bookings'
        });
    }

    moduleRun.$inject = [];

    function moduleRun() {

    }


}(angular));
