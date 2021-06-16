(function (angular) {
    var module = angular.module('cab9.reports', []);

    module.config(moduleConfig);
    module.run(moduleRun);
    moduleConfig.$inject = [];
    module.constant('$UI', {
        COLOURS: {
            brandPrimary: '#68B8F6',
            brandSecondary: '#3D799B',
            blue: '#032b5a',
            red: '#F55753',
            yellow: '#F8D053',
            cyan: '#10CFBD',
            sky: '#48B0F7',
            green: '#64c458',
            purple: '#6D5CAE',
            brandGrey: '#3B4752',
            darkGrey: '#2B303B',
            lightGrey: 'rgba(100,100,100,0.1)',
            grey: '#788195',
            lighterGrey: 'rgba(0,0,0,0.2)'
        }
    });
    module.factory('reports', ['$http', '$rootScope', function ($http, $rootScope) {
        var o = {};
        o.getQuery = function () {
            var query = "";
            for (var property in $rootScope.filters) {
                if ($rootScope.filters.hasOwnProperty(property))
                    if ($rootScope.filters[property]) {
                        if (property == 'From' || property == 'To')
                            query += property + '=' + moment($rootScope.filters[property]).format('YYYY-MM-DD') + '&';
                        else if ($rootScope.filters[property].length > 0) {
                            if (property == "DriverIds" || property == "ClientIds" || property == "PassengerIds" || property == "VehicleTypeIds" || property == "VehicleClassIds" || property == "CurrencyIds")
                                query += property + '=' + $rootScope.filters[property].map(function (item) {
                                    return "'" + item.replace(/ /g, '') + "'"
                                }) + '&'
                            else
                                query += property + '=' + $rootScope.filters[property] + '&'
                        }
                    }
            }
            return query;
        }
        return o;
    }]);

    function moduleConfig() {}
    moduleRun.$inject = [];

    function moduleRun() {}

}(angular));