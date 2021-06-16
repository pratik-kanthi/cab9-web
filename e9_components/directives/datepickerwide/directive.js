(function (angular) {
    var module = angular.module('framework.UI', []);

    module.directive('datePickerWide', datePickerWide);

    datePickerWide.$inject = ['$timeout'];
    function datePickerWide($timeout) {
        return {
            restrict: 'E',
            scope: {
                start: '&',
                end: '&',
                selected: '=',
                showToggle: '='
            },
            templateUrl: '/e9_components/directives/datepickerwide/partial.html',
            link: function (scope, elem, attrs, ctrls) {
                var startDate = new moment(scope.start());
                var endDate = new moment(scope.end());
                scope.selectYear = selectYear;
                scope.selectMonth = selectMonth;
                scope.selectDay = selectDay;
                scope.dateShow = attrs.dateshow;
                scope.hideDates = ('hideDates' in attrs);
                scope.days = true;
                scope.utc = ('utc' in attrs);

                init();

                function getDate(initial) {
                    if (scope.utc) {
                        return new moment.tz(initial, 'utc');
                    } else {
                        return new moment(initial);
                    }
                }

                function init() {
                    scope.years = [];
                    scope.months = moment.monthsShort().map(function (v, i) { return { title: v, value: i, show: true } });
                    scope.weeks = {};
                    if (attrs.range) {
                        scope.range = true;
                        scope.selected = scope.selected || {};
                        scope.selected.from = getDate(scope.selected.from).startOf('day');
                        scope.selected.to = getDate(scope.selected.to).endOf('day');
                        scope.span = 'day';
                    } else {
                        scope.range = false;
                        scope.selected = new moment(scope.selected);
                    }
                    draw();
                }

                function draw() {
                    calcYears(startDate, endDate);
                }

                function calcYears(start, end) {
                    scope.years.length = 0;
                    $timeout(function () {
                        var
                            startYear = start.year(),
                            endYear = end.year();
                        for (var currentYear = startYear; currentYear <= endYear; currentYear++) {
                            scope.years.push({ title: currentYear, value: currentYear });
                        }
                        calcMonths(start, end, scope.selected);
                    }, 0);
                }

                function calcMonths(start, end, selected) {
                    if (scope.range) {
                        selected = selected.from;
                    }
                    angular.forEach(scope.months, function (m, i) {
                        var test = selected.clone().month(i).hour(12);
                        m.show = test.isBetween(start.startOf('day'), end.endOf('day'));
                    });
                    calcWeeks(start, end, scope.selected);
                }

                function calcWeeks(start, end, selected) {
                    scope.weeks = [];
                    $timeout(function () {
                        if (scope.range) {
                            selected = selected.from;
                        }
                        if (selected) {
                            var current, monthEnd;
                            current = selected.clone().startOf('month'),
                            monthEnd = selected.clone().endOf('month');

                            scope.weeks = [];
                            while (current.isBefore(monthEnd)) {
                                if (current.isBetween(start, end)) {
                                    var weekNo = current.isoWeek();
                                    var day = {
                                        title: current.format('DD'),
                                        name: current.format('dd'),
                                        value: current.date(),
                                        status: ''
                                    };
                                    if (scope.weeks.filter(function (w) { return w.number == weekNo }).length) {
                                        scope.weeks.filter(function (w) { return w.number == weekNo })[0].days.push(day);
                                    } else {

                                        scope.weeks.push({ number: weekNo, days: [day] });
                                    }
                                }

                                current.add(1, 'day');
                            }
                        }
                    }, 0);
                }

                function selectYear(year) {
                    if (scope.range) {
                        scope.selected.from.year(year).startOf('year');
                        scope.selected.to.year(year).endOf('year');
                        scope.selected.span = 'year'
                    } else {
                        scope.selected.year(year);
                    }
                    clampSelected();
                    calcMonths(startDate, endDate, scope.selected);
                }

                function selectMonth(month) {
                    if (scope.range) {
                        scope.selected.from.month(month).startOf('month');
                        scope.selected.to.month(month).endOf('month');
                        scope.selected.span = 'month'
                    } else {
                        scope.selected.month(month);
                    }

                    clampSelected();
                    calcWeeks(startDate, endDate, scope.selected);
                }

                function selectDay(date) {
                    if (scope.range) {
                        scope.selected.from.date(date).startOf('day');
                        scope.selected.to.date(date).endOf('day');
                        scope.selected.span = 'day'
                    } else {
                        scope.selected.date(date);
                    }
                }

                function clampSelected() {
                    if (scope.range) {
                        if (startDate.isAfter(scope.selected.from)) {
                            scope.selected.from = getDate(startDate.clone());
                        }
                        if (endDate.isBefore(scope.selected.to)) {
                            scope.selected.to = getDate(endDate.clone());
                        }
                    } else {
                        if (startDate.isAfter(scope.selected)) {
                            scope.selected = getDate(startDate.clone());
                        }
                        if (endDate.isBefore(scope.selected)) {
                            scope.selected = getDate(endDate.clone());
                        }
                    }

                }
            }
        }
    }
})(angular);