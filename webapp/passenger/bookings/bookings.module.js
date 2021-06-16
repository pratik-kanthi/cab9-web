(function (angular) {
    var module = angular.module('cab9.passenger.bookings', []);

    module.config(moduleConfig);
    module.run(moduleRun);

    moduleConfig.$inject = ['$stateProvider', 'MenuServiceProvider', '$urlRouterProvider'];

    function moduleConfig($stateProvider, MenuServiceProvider, $urlRouterProvider) {
        $stateProvider.state('root.bookings', {
            url: '/bookings',
            views: {
                'content-wrapper@root': {
                    controller: 'BookingsTableController',
                    templateUrl: '/webapp/passenger/bookings/bookings-table.partial.html'
                }
            }
        });

        $stateProvider.state('root.bookings.create', {
            url: '/create',
            views: {
                'content-wrapper@root': {
                    controller: 'BookingCreateController',
                    templateUrl: '/webapp/passenger/bookings/edit/booking-edit.partial.html',
                    resolve: {
                        rPassenger: ['Model','Auth', function (Model, Auth) {
                            var passengerId = Auth.getSession().Claims.PassengerId ? Auth.getSession().Claims.PassengerId[0] : null;
                            return Model.Passenger
                                .query()
                                .select('Id,Firstname,Surname,ClientId,Mobile,ImageUrl,Client/Name')
                                .include('Client')
                                .filter('Id', '==', "guid'" + passengerId + "'")
                                .parseAs(function (item) {
                                    this.Id = item.Id;
                                    this.Name = item.Firstname + ' ' + item.Surname;
                                    this.Description = (item.Mobile) ? item.Mobile : 'No Mobile';
                                    this.ClientId = item.ClientId;
                                    this.ImageUrl = window.formatImage(item.ImageUrl, item.Firstname);
                                })
                                .execute();
                        }],
                        rClient: ['Model', 'rPassenger', function (Model, rPassenger) {
                            var query = Model.Client
                                .query()
                                .select('Id,Name,ImageUrl,ClientType/Name,DefaultCurrencyId')
                                .include('ClientType');

                            if (rPassenger[0].ClientId)
                                query.filter('Id', '==', "guid'" + rPassenger[0].ClientId + "'");

                             return query.parseAs(function (data) {
                                        this.Id = data.Id;
                                        this.Name = data.Name;
                                        this.Description = data.ClientType.Name;
                                        this.ImageUrl = window.formatImage(data.ImageUrl, data.Name);
                                        this.DefaultCurrencyId = data.DefaultCurrencyId;
                                    }).execute();

                            
                        }],
                        rVehicleTypes: ['Model', function (Model) {
                            return Model.VehicleType.query().execute();
                        }],
                        rVehicleClasses: ['Model', function (Model) {
                            return Model.VehicleClass.query().execute();
                        }],
                        rCurrencies: ['Model', function (Model) {
                            return Model.Currency
                                .query()
                                .execute();

                        }],
                        rTaxes: ['Model', function (Model) {
                            return Model.Tax
                                .query()
                                .include('TaxType')
                                .execute();
                        }]
                    }
                }
            }
        });

        $stateProvider.state('root.bookings.viewer', {
            url: '/:Id',
            default: 'root.bookings.viewer.details',
            resolve: {
                rBooking: ['Model', '$stateParams', function (Model, $stateParams) {
                    return Model.Booking
                        .query()
                        .filter('Id', '==', "guid'" + $stateParams.Id + "'")
                        .include('Driver,Client,Vehicle,BookingStops,BookingStops/PassengerStops,Passengers,LeadPassenger,Currency,BookingRequirements,Notifications')
                        .trackingEnabled()
                        .execute()
                        .then(function (data) {
                            return data[0];
                        });
                }],
                rClients: ['Model', function (Model) {
                    return Model.Client
                        .query()
                        .select('Id,Name,ImageUrl,ClientType/Name, DefaultCurrencyId')
                        .include('ClientType')
                        .parseAs(function (data) {
                            this.Id = data.Id;
                            this.Name = data.Name;
                            this.Description = data.ClientType.Name;
                            this.ImageUrl = window.formatImage(data.ImageUrl, data.Name);
                            this.DefaultCurrencyId = data.DefaultCurrencyId;
                        })
                        .execute();
                }],
                rVehicleTypes: ['Model', function (Model) {
                    return Model.VehicleType.query().select('Id,Name').execute();
                }],
                rVehicleClasses: ['Model', function (Model) {
                    return Model.VehicleClass.query().select('Id,Name').execute();
                }],
                rDrivers: ['Model', function (Model) {
                    return Model.Driver
                        .query()
                        .select('Id,Firstname,Surname,Callsign,ImageUrl,DriverType/Name')
                        .include('DriverType')
                        .parseAs(function (item) {
                            this.Id = item.Id;
                            this.Name = item.Firstname + ' ' + item.Surname + ' (' + item.Callsign + ')';
                            this.Description = item.DriverType.Name;
                            this.ImageUrl = window.formatImage(item.ImageUrl, item.Callsign);
                        })
                        .execute();
                }],
                rVehicles: ['Model', function (Model) {
                    return Model.Vehicle
                        .query()
                        .select('Id,Registration,Colour,Make,Model,Class,Type')
                        .include('Class,Type')
                        .parseAs(function (item) {
                            this.Id = item.Id;
                            this.Name = item.Registration;
                            this.Description = item.Colour + ' ' + item.Make + ' ' + item.Model;
                            this.DriverId = item.DriverId;
                            this.ImageUrl = window.formatImage(item.ImageUrl, item.Registration);
                        })
                        .execute();
                }],
                rPassengers: ['Model', function (Model) {
                    return Model.Passenger
                        .query()
                        .select('Id,Firstname,Surname,ClientId,ImageUrl,Client/Name')
                        .include('Client')
                        .parseAs(function (item) {
                            this.Id = item.Id;
                            this.Name = item.Firstname + ' ' + item.Surname;
                            this.Description = (item.Mobile) ? item.Mobile : 'No Mobile';
                            this.ClientId = item.ClientId;
                            this.ImageUrl = window.formatImage(item.ImageUrl, item.Firstname);
                        })
                        .execute();
                }],
                rTabs: function () {
                    return [{
                        heading: 'Details',
                        route: 'root.bookings.viewer.details'
                    }];
                },
                rTaxes: ['Model', function (Model) {
                    return Model.Tax
                        .query()
                        .include('TaxType')
                        .execute();
                }]
            },
            views: {
                'content-wrapper@root': {
                    controller: 'BookingsViewerController',
                    templateUrl: '/webapp/passenger/bookings/bookings-viewer.partial.html'
                }
            }
        });

        $stateProvider.state('root.bookings.viewer.details', {
            url: '/details',
            templateUrl: '/webapp/passenger/bookings/edit/booking-edit.partial.html',
            controller: 'BookingEditController'
        });


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