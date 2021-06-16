window.dispatchCleanup = [];
(function (window, angular) {
    var module = angular.module('cab9.dispatch', [
        'framework.services.data',
        'framework.services.google'
    ]);

    module.config(moduleConfig);

    moduleConfig.$inject = ['$stateProvider', '$urlRouterProvider', 'MenuServiceProvider', '$permissions'];

    function moduleConfig($stateProvider, $urlRouterProvider, MenuServiceProvider, $permissions) {
        if (!$permissions.test('dispatch')) return;
        $stateProvider.state('dispatch', {
            url: '/dispatch',
            permission: 'Dispatch',
            onExit: function () {
                angular.forEach(window.dispatchCleanup, function (fn) {
                    return fn();
                });
                window.dispatchCleanup.length = 0;
            },
            resolve: {
                rCompany: ['Model', 'Auth',
                    function (Model, Auth) {
                        return Model.Company
                            .query()
                            .select('Id,BaseLatitude,BaseLongitude,BaseZoom,DispatchLatitude,RequiresContactNumber,DispatchLongitude,DispatchZoom,AutoCopyPassengerNotes,RequiresClient,RequiresBooker,DefaultPax,DefaultBax,TextConfirmation,EmailConfirmation,TextOnArrival,CallOnArrival,TextAssigned,EmailAssigned,TextOnCompletion,TextOnOnRoute')
                            .filter("Id eq guid'" + Auth.getSession().TenantId + "'")
                            .execute();
                    }
                ],
                rTags: ['Model', 'Auth',
                    function (Model, Auth) {
                        return Model.Tag
                            .query()
                            .filter("TenantId eq guid'" + Auth.getSession().TenantId + "'")
                            .execute();
                    }
                ]
            },
            views: {
                'layout': {
                    controller: 'DispatchController',
                    templateUrl: '/webapp/management/dispatch/dispatch.layout.html'
                },
                'map@dispatch': {
                    controller: 'DispatchMapController',
                    templateUrl: '/webapp/management/dispatch/map/partial.html'
                },
                'drivers@dispatch': {
                    templateUrl: '/webapp/management/dispatch/drivers/partial.html',
                    controller: 'DispatchDriversController'
                },
                'bookings@dispatch': {
                    templateUrl: '/webapp/management/dispatch/bookings/partial.html',
                    controller: 'DispatchBookingsController'
                },
                'workshare@dispatch': {
                    templateUrl: '/webapp/management/dispatch/workshare/partial.html',
                    controller: 'DispatchWorkshareController'
                },
                'unconfirmed@dispatch': {
                    templateUrl: '/webapp/management/dispatch/unconfirmed/partial.html',
                    controller: 'DispatchUnconfirmedBookingController'
                }
            }
        });

        $stateProvider.state('dispatch.bookings', {
            url: '/bookings',
            views: {},
            onEnter: function () {
                //This ensures that the bookings list is shown when user moves from another tab
                setTimeout(function () {
                    $(window).trigger('resize');
                }, 250);
            }
        });

        $stateProvider.state('dispatch.drivers', {
            url: '/drivers',
            onEnter: function () {

            },
            views: {}
        });
        $stateProvider.state('dispatch.workshare', {
            url: '/workshare',
            onEnter: function () {
                //This ensures that the bookings list is shown when user moves from another tab
                setTimeout(function () {
                    $(window).trigger('resize');
                }, 250);
            }
        });

        $stateProvider.state('dispatch.newbooking', {
            url: '/new-booking',
            resolve: {},
            views: {
                'newbooking@dispatch': {
                    templateUrl: '/webapp/management/dispatch/new/partial.html',
                    controller: 'DispatchNewBookingController'
                },
            }
        });

        $stateProvider.state('dispatch.unconfirmed', {
            url: '/unconfirmed',
            onEnter: function () {},
            onExit: function () {},
            resolve: {},
            views: {}
        });

        MenuServiceProvider.registerMenuItem({
            state: 'dispatch.bookings',
            icon: 'map',
            title: 'Dispatch'
        });
    }
})(window, angular);