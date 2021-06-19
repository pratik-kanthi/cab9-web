(function () {
    var module = angular.module('framework.services.google', []);
    module.service('Google', googleService);
    module.provider('GoogleDirections', googleDirectionsServiceProvider);

    googleService.$inject = ['GoogleDirections'];
    function googleService(GoogleDirections) {
        this.Maps = {
            Directions: GoogleDirections
        }
    }

    function googleDirectionsServiceProvider() {
        var $engine = null;
        var $defaults = {
            avoidFerries: false,
            avoidHighways: true,
            avoidTolls: false,
            //durationInTraffic: false,
            optimizeWaypoints: false,
            //provideRouteAlternatives: true,
            region: 'GB',
            travelMode: google.maps.TravelMode.DRIVING,
            //unitSystem: google.maps.UnitSystem.IMPERIAL
        };


        this.setDefaults = setDefaults;
        this.$get = googleDirectionsService;

        function setDefaults(settings) {
            angular.extend($defaults, settings);
        }

        googleDirectionsService.$inject = ['$q'];
        function googleDirectionsService($q) {
            $engine = ($engine || new google.maps.DirectionsService());

            this.route = route;

            function route(journey, options) {
                var deferred = $q.defer();
                var request = angular.extend({}, $defaults, options);
                request.origin = journey[0];
                request.destination = journey[journey.length - 1];
                if (journey.length > 2) {
                    request.waypoints = journey.slice(1, journey.length - 1).map(function (wp) { return { location: wp, stopover: false }; });
                }
                $engine.route(request, function (result, status) {
                    if (status === google.maps.DirectionsStatus.OK) {
                        deferred.resolve(result);
                    } else {
                        deferred.reject(status);
                    }
                });
                return deferred.promise;
            }

            return this;
        }
    }
}());