(function (window, angular) {
    var module = angular.module('cab9.dispatch', [
        'framework.services.data',
        'framework.services.google'
    ]);

    module.config(moduleConfig);

    moduleConfig.$inject = ['$stateProvider', '$urlRouterProvider', 'MenuServiceProvider'];

    function moduleConfig($stateProvider, $urlRouterProvider, MenuServiceProvider) {
        $stateProvider.state('dispatch', {
            url: '/dispatch',
            resolve: {
                rBookings: ['Model', function (Model) {
                    return [];
                }],
                rDrivers: ['Model', function (Model) {
                    return Model.Driver
                        .query()
                        .trackingEnabled()
                        .execute();
                }],
                rClients: ['Model', function (Model) {
                    return Model.Client.query().select('Id,Name,DefaultCurrencyId,ImageUrl,ClientType/Name').include('ClientType').parseAs(function (item) {
                        this.Id = item.Id;
                        this.Name = item.Name;
                        this.DefaultCurrencyId = item.DefaultCurrencyId;
                        this.Description = item.ClientType.Name;
                        this.ImageUrl = formatUrl(item.ImageUrl, item.Name);
                    }).execute();
                }],
                rPassengers: ['Model', function (Model) {
                    return Model.Passenger.query().parseAs(function (item) {
                        this.Id = item.Id;
                        this.ClientId = item.ClientId;
                        this.Name = item.Firstname + ' ' + item.Surname;
                        this.Description = item.Mobile;
                        this.ImageUrl = formatUrl(item.ImageUrl, item.Name);
                    }).execute();
                }],
                rVehicleTypes: ['Model', function (Model) {
                    return Model.VehicleType.query().execute();
                }],
                rVehicleClasses: ['Model', function (Model) {
                    return Model.VehicleClass.query().execute();
                }],
                rBookingRequirements: ['Model', function (Model) {
                    return Model.BookingRequirement.query().execute();
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
            },
            views: {
                'layout': {
                    controller: 'DispatchController', //Old
                    templateUrl: '/webapp/management/dispatch/dispatch.layout.html' //old.
                }
            }
        });

        $stateProvider.state('dispatch.bookings.details', {
            url: '/:Id',
            views: {
                'details@dispatch': {
                    templateUrl: '/webapp/management/dispatch/dispatch-details.partial.html',
                    controller: 'DispatchBookingDetailsController'
                }
            }
        });

        $stateProvider.state('dispatch.bookings', {
            url: '/bookings',
            views: {
                'panel@dispatch': {
                    templateUrl: '/webapp/management/dispatch/dispatch-bookings.partial.html'
                }
            }
        });

        $stateProvider.state('dispatch.drivers', {
            url: '/drivers',
            views: {
                'panel@dispatch': {
                    templateUrl: '/webapp/management/dispatch/dispatch-drivers.partial.html'
                }
            }
        });

        $stateProvider.state('dispatch.newbooking', {
            url: '/new-booking',
            views: {
                'panel@dispatch': {
                    templateUrl: '/webapp/management/dispatch/dispatch-newbooking.partial.html',
                    controller: 'DispatchNewBookingController'
                }
            }
        });

        MenuServiceProvider.registerMenuItem({
            state: 'dispatch.bookings',
            icon: 'map',
            title: 'Dispatch'
        });
    }
})(window, angular);