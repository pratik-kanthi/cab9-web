import React from "react";
import ReactDOM from "react-dom";
import Bookings from "./Bookings.js";

(function (angular) {
    var module = angular.module('cab9.dispatch');

    module.directive('reactBooking', reactBooking);
    reactBooking.$inject = ['$state', '$interval', '$parse', '$filter'];

    function reactBooking($state, $interval, $parse, $filter) {
        return {
            template: '<div class="react-part"></div>',
            scope: {
                dispatchObj: '=',
                bookings: '=',
                reload: '=',
                openBooking: '&',
                editBooking: '&',
                bidQueue: '&',
                selectBooking: '&',
                enableBidding: '=',
                removeCompleted: '&',
                removeCancelled: '&',
                approveChanges: '&',
                allocateDriver: '&',
                acceptBooking: '&',
                confirm: '&',
                rejectBooking: '&'
            },
            link: function (scope, el, attrs) {
                var companyDateFilter = $filter("companyDate");
                const reactapp = el.find('.react-part')[0]
                scope.$watch('reload', function (newValue, oldValue) {
                    if (angular.isDefined(scope.bookings)) {
                        ReactDOM.render(
                            <Bookings
                            dispatchObj={scope.dispatchObj}
                            bookings={scope.bookings}
                            enableBidding={scope.enableBidding}
                            openBooking={scope.openBooking}
                            editBooking={scope.editBooking}
                            addToBidQueue={scope.bidQueue}
                            selectBooking={scope.selectBooking}
                            removeCompleted={scope.removeCompleted}
                            removeCancelled={scope.removeCancelled}
                            approveChanges={scope.approveChanges}
                            allocateDriver={scope.allocateDriver}
                            acceptBooking={scope.acceptBooking}
                            loading={scope.loading}
                            confirm={scope.confirm}
                            rejectBooking={scope.rejectBooking}
                            companyDateFilter={companyDateFilter}/>, reactapp);
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