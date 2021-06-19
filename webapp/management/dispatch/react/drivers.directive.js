import React from "react";
import ReactDOM from "react-dom";
import Drivers from "./drivers.js";

(function (angular) {
    var module = angular.module('cab9.dispatch');

    module.directive('reactDriver', reactDriver);
    reactDriver.$inject = ['$state', '$interval', '$parse', '$filter'];

    function reactDriver($state, $interval, $parse, $filter) {
        return {
            template: '<div id="reactdriverapp" class="react-part"></div>',
            scope: {
                dispatchObj: '=',
                reload: '=',
                formatImage: '&',
                selectDriver: '&'
            },
            link: function (scope, el, attrs) {
                const reactapp = document.getElementById('reactdriverapp')
                var filter = angular
                    .injector(["ng"])
                    .get("$filter")("filter");

                var order = angular
                    .injector(["ng"])
                    .get("$filter")("orderBy");

                var currencyFilter = angular
                    .injector(["ng"])
                    .get("$filter")("currency");

                var timeFilter = angular
                    .injector(["ng", "framework.filters.utility"])
                    .get("$filter")("time");

                var countDownFilter = $filter("Countdown");

                scope.$watchGroup([
                    'reload', 'dispatchObj.driverSearch.$'
                ], function (newValues, oldValues) {
                    if (angular.isDefined(scope.dispatchObj)) {
                        ReactDOM.render(
                            <Drivers
                            dispatchObj={scope.dispatchObj}
                            formatImage={scope.formatImage}
                            selectDriver={scope.selectDriver}
                            filter={filter}
                            order={order}
                            currencyFilter={currencyFilter}
                            countdown={countDownFilter}
                            timeFilter={timeFilter}/>, reactapp);
                    }
                });

                scope.$on("$destroy", unmountReactElement);

                function unmountReactElement() {
                    ReactDOM.unmountComponentAtNode(reactapp);
                }

            }
        }
    }
})(angular);