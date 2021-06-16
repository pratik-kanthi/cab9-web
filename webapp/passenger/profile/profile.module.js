(function (angular) {
    var module = angular.module('cab9.passenger.profile', []);

    module.config(moduleConfig);
    module.run(moduleRun);

    moduleConfig.$inject = ['$stateProvider', 'MenuServiceProvider', '$urlRouterProvider'];

    function moduleConfig($stateProvider, MenuServiceProvider, $urlRouterProvider) {
        $stateProvider.state('root.profile', {
            url: '/profile',
            views: {
                'content-wrapper@root': {
                    controller: 'ProfileController',
                    templateUrl: '/webapp/passenger/profile/profile.partial.html'
                }
            },
            resolve: {
                'rData': ['Model', '$stateParams', 'Auth', '$q',
                             function (Model, $stateParams, Auth, $q) {
                                 var defered = $q.defer();
                                 Model.User
                                     .query()
                                     .where('Id', '==', "'" + Auth.getSession().UserId + "'")
                                     .include('Claims')
                                     .trackingEnabled()
                                     .execute()
                                     .then(function (user) {
                                         var pasgrClaim = user[0].Claims.filter(function (c) {
                                             return c.ClaimType == "PassengerId"
                                         })[0];
                                         if (pasgrClaim) {
                                             Model.Passenger
                                                 .query()
                                                 .where('Id', '==', "guid'" + pasgrClaim.ClaimValue + "'")
                                                 .trackingEnabled()
                                                 .execute()
                                                 .then(function (c) {
                                                     defered.resolve(c);
                                                 });
                                         }
                                     });
                                 return defered.promise;
                             }
                ]
            }
        });
        
        MenuServiceProvider.registerMenuItem({
            state: 'root.profile',
            icon: 'settings',
            title: 'Profile'
        });
    }

    moduleRun.$inject = [];

    function moduleRun() {

    }


}(angular));