(function (angular) {
    'use strict';

    var module = angular.module('framework.directives.utils');

    module.directive('addressPopulate', [addressPopulate]);

    function addressPopulate() {
        return {
            restrict: 'E',
            template: '<div class="form-group"><label for="" ng-if="!showLabel">Address Finder</label><input type="text" class="form-control google-address-text" /></div>',
            scope: {
                object: '=',
                showLabel: '=',
                defaultFill: '='
            },
            link: function (scope, element, attrs) {
                var prefix = attrs['prefix'] || '';
                var e = element.find('input')[0];
                if(scope.object.StopSummary && scope.defaultFill){
                    e.value = scope.object.StopSummary;
                }
                var autocomplete = new google.maps.places.Autocomplete(element.find('input')[0], {
                    bounds: new google.maps.LatLngBounds({ lat: 49.173624, lng: -11.184082 }, { lat: 59.326885, lng: 2.790527 })
                });
                autocomplete.addListener('place_changed', fillInAddress);

                function fillInAddress() {
                    var place = autocomplete.getPlace();
                    console.log(place);
                    scope.object[prefix + "Address1"] = "";
                    scope.object[prefix + "Address2"] = "";
                    scope.object[prefix + "Area"] = "";
                    scope.object[prefix + "TownCity"] = "";
                    scope.object[prefix + "Postcode"] = "";
                    scope.object[prefix + "County"] = "";
                    scope.object[prefix + "Country"] = "";
                    scope.object[prefix + "Latitude"] = "";
                    scope.object[prefix + "Longitude"] = "";
                    for (var i = 0; i < place.address_components.length; i++) {
                        var addressType = place.address_components[i].types[0];
                        var val = place.address_components[i].long_name;
                        switch (addressType) {
                        case 'street_number':
                            scope.object[prefix + "Address1"] = val;
                            break;
                        case 'route':
                            if (scope.object[prefix + "Address1"]) {
                                scope.object[prefix + "Address1"] = scope.object[prefix + "Address1"] + ' ' + val;
                            } else {
                                scope.object[prefix + "Address1"] = val;
                            }
                            break;
                        case '':
                            scope.object[prefix + "Address2"] = val;
                            break;
                        case 'locality':
                            scope.object[prefix + "Area"] = val;
                            break;
                        case 'postal_town':
                            scope.object[prefix + "TownCity"] = val;
                            break;
                        case 'postal_code_prefix':
                        case 'postal_code':
                            scope.object[prefix + "Postcode"] = val;
                            break;
                        case 'administrative_area_level_2':
                            scope.object[prefix + "County"] = val;
                            break;
                        case 'country':
                            scope.object[prefix + "Country"] = val;
                            break;
                        default:
                            break;

                        }
                    }
                    scope.object[prefix + "Latitude"] = place.geometry.location.lat();
                    scope.object[prefix + "Longitude"] = place.geometry.location.lng();
                    scope.$apply();
                    scope.$emit('address_changed:' + prefix, {
                        latitude: place.geometry.location.lat(),
                        longitude: place.geometry.location.lng()
                    });
                }
            }
        };
    }
}(angular));