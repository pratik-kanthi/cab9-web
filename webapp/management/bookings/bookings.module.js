(function(angular) {
    var module = angular.module('cab9.bookings', ['cab9.common']);

    module.config(moduleConfig);
    module.run(moduleRun);

    moduleConfig.$inject = ['$stateProvider', 'MenuServiceProvider', '$urlRouterProvider', '$permissions'];

    function moduleConfig($stateProvider, MenuServiceProvider, $urlRouterProvider, $permissions) {
        if (!$permissions.test('bookings')) return;
        $stateProvider.state('root.bookings', {
            url: '/bookings',
            searchText: 'dockets bookings jobs',
            searchName: 'Bookings Table',
            searchIcon: 'event_note',
            permission: 'Bookings',
            views: {
                'content-wrapper@root': {
                    controller: 'BookingsTableController',
                    templateUrl: '/webapp/management/bookings/all/bookings-table.partial.html',
                    resolve: {
                        rDrivers: ['Model', function(Model) {
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
                        controller: 'BookingCreateController',
                        templateUrl: '/webapp/management/bookings/new/booking-new.partial.html'
                    }
                },
                resolve: {
                    rCompany: ['Model', 'Auth', function(Model, Auth) {
                        return Model.Company
                            .query()
                            .filter("Id eq guid'" + Auth.getSession().TenantId + "'")
                            .select("AutoCopyPassengerNotes,RequiresClient,RequiresBooker,RequiresContactNumber,DefaultPax,DefaultBax,TextConfirmation,EmailConfirmation,TextOnArrival,CallOnArrival,TextAssigned,EmailAssigned,TextOnCompletion,TextOnOnRoute")
                            .execute();
                    }],
                    rTags: ['Model', 'Auth',
                    function (Model, Auth) {
                        return Model.Tag
                            .query()
                            .filter("TenantId eq guid'" + Auth.getSession().TenantId + "'")
                            .execute();
                    }
                ]
                }
            });
        }

        if ($permissions.test('bookings.validation')) {
            $stateProvider.state('root.bookings.validation', {
                url: '/validation',
                permission: 'Bookings - Validation',
                views: {
                    'content-wrapper@root': {
                        controller: 'BookingValidationController',
                        templateUrl: '/webapp/management/bookings/validation/booking-validation.partial.html'
                    }
                },
                resolve: {
                    rVehicleTypes: ['Model', function(Model) {
                        return Model.VehicleType.query().execute();
                    }]
                }
            });
        }

        if ($permissions.test('bookings.cc-bookings')) {
            $stateProvider.state('root.bookings.cc-bookings', {
                url: '/cc-bookings',
                permission: 'Bookings - CC-Bookings',
                views: {
                    'content-wrapper@root': {
                        controller: 'CCBookingsController',
                        templateUrl: '/webapp/management/bookings/cc-bookings/partial.html'
                    }
                }
            });
        }

        if ($permissions.test('bookings.calls')) {
            $stateProvider.state('root.bookings.calls', {
                url: '/calls',
                permission: 'Bookings - Calls',
                views: {
                    'content-wrapper@root': {
                        controller: 'CallsController',
                        templateUrl: '/webapp/management/bookings/calls/partial.html'
                    }
                },
                resolve: {
                    rStaff: ['Model', function(Model) {
                        return Model.Staff
                            .query()
                            .select('Id,Firstname,Surname,ImageUrl')
                            .parseAs(function(item) {
                                this.Id = item.Id;
                                this.Name = item.Firstname + ' ' + item.Surname;
                            })
                            .execute();
                    }]
                }
            });
        }
        
        
        if ($permissions.test('bookings.repeat')){
            $stateProvider.state('root.bookings.repeat', {
                url: '/repeat-bookings',
                permission: 'Bookings - Repeat',
                views: {
                    'content-wrapper@root': {
                        controller: 'RepeatBookingsController',
                        templateUrl: '/webapp/management/bookings/repeat/partial.html'
                    }
                }
            });
        }


        $stateProvider.state('root.bookings.search', {
            url: '/:localId',
            views: {
                'content-wrapper@root': {
                    controller: 'BookingsTableController',
                    templateUrl: '/webapp/management/bookings/all/bookings-table.partial.html',
                    resolve: {
                        rDrivers: ['Model', function(Model) {
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
                        }]
                    }
                }
            }
        });


        var subMenus = [{
            title: 'All',
            state: 'root.bookings',
            icon: 'event_note'
        }]

        if ($permissions.test('bookings.validation')) {
            subMenus.push({
                title: 'Validation',
                state: 'root.bookings.validation',
                icon: 'event_note'
            });
        }

        if ($permissions.test('bookings.cc-bookings')) {
            subMenus.push({
                title: 'CC Bookings',
                state: 'root.bookings.cc-bookings',
                icon: 'event_note'
            });
        }

        if($permissions.test('bookings.repeat')){
            subMenus.push({
                title: 'Repeat Bookings',
                state: 'root.bookings.repeat',
                icon: 'repeat'
            });
        }

        if ($permissions.test('bookings.calls')) {
            subMenus.push({
                title: 'Calls',
                state: 'root.bookings.calls',
                icon: 'event_note'
            });
        }

        MenuServiceProvider.registerMenuItem({
            subMenus: subMenus.filter(function(s) {
                return s.state.substring(5); //$permissions.test(s.state.substring(5));
            }),
            icon: 'event_note',
            title: 'Bookings'
        });

        function formatUrl(ImageUrl, text) {
            if (ImageUrl) {
                if (ImageUrl.slice(0, 4) == 'http') {
                    return ImageUrl;
                } else {
                    return window.resourceEndpoint + ImageUrl;
                }
            } else {
                return $config.API_ENDPOINT + 'api/imagegen?text=' + text;
            }
        }


    }

    moduleRun.$inject = [];

    function moduleRun() {

    }


}(angular));