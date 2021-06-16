(function (angular) {
    var module = angular.module('cab9.drivers');

    module.controller('DriverShiftsController', driverShiftsController);

    driverShiftsController.$inject = ['$scope', '$modal', 'Model', '$q', '$http', '$config', '$window', 'Auth'];

    function driverShiftsController($scope, $modal, Model, $q, $http, $config, $window, Auth) {
        $scope.shifts = [];
        $scope.filterdDates = [];
        $scope.fetchingShifts = false;

        $scope.currentWeekEnding = new moment().endOf('isoweek').toDate();

        $scope.filter = {
            date: {
                from: new moment().startOf('isoweek').toDate(),
                to: new moment().endOf('isoweek').toDate(),
                span: 'week',
                selectedPeriod: 'This Week'
            }
        }

        setTimeout(function () {
            $('#daterangepicker_shifts').daterangepicker({
                locale: {
                    format: 'DD/MM/YYYY'
                },
                "autoApply": true,
                "startDate": moment($scope.filter.date.from).startOf('day'),
                "endDate": moment($scope.filter.date.to).endOf("day"),
                "opens": "right",
                ranges: {
                    'Today': [moment().startOf("day"), moment().endOf("day")],
                    'This Week': [moment().startOf('isoweek'), moment().endOf('isoweek')],
                    'This Month': [moment().startOf('month'), moment().endOf('month')]
                },
                "alwaysShowCalendars": true,
            });

            $('#daterangepicker_shifts').on('apply.daterangepicker', function (ev, picker) {
                $scope.filter.date.selectedPeriod = picker.chosenLabel;
                $scope.filter.date.from = picker.startDate.toISOString();
                $scope.filter.date.to = picker.endDate.toISOString();
                if ($scope.filter.date.selectedPeriod == "Custom Range") {
                    $scope.filter.date.selectedPeriod = " (" + moment($scope.filter.date.from).format('DD/MM/YYYY') + " - " + moment($scope.filter.date.to).format('DD/MM/YYYY') + ")";
                }
                $scope.$apply();
                fetchShifts();
            });
        }, 100)

        $scope.datePickers = {
            from: false,
            to: false
        }

        $scope.openDatePicker = function ($event, type) {
            $scope.datePickers[type] = !$scope.datePickers[type];
            event.preventDefault();
            event.stopPropagation();
        }

        $scope.fetchShifts = fetchShifts;
        $scope.expandShifts = expandShifts;
        $scope.exportDriverShifts = exportDriverShifts;
        $scope.toggleSearch = toggleSearch;

        $scope.openNotesModal = openNotesModal;

        fetchShifts();

        function toggleSearch() {
            $scope.showSearch = !$scope.showSearch;
        }

        function exportDriverShifts() {
            debugger;
            var url = "api/drivershift/export?tenantId=" + Auth.getSession().TenantId + "&startDate=" + moment($scope.filter.date.from).format('YYYY-MM-DD') + "&endDate=" + moment($scope.filter.date.to).format('YYYY-MM-DD');
            $window.open($config.API_ENDPOINT + url, '_blank');
        }

        function splitFilterDays() {
            $scope.filterdDates = [];
            var diffInDays = moment($scope.filter.date.to).diff($scope.filter.date.from, 'days');
            for (var i = 0; i <= diffInDays; i++) {
                var dt = {
                    _date: moment($scope.filter.date.from).add(i, 'days').format('YYYY-MM-DD'),
                    _uidate: moment($scope.filter.date.from).add(i, 'days').format('DD/MM/YYYY')
                }
                $scope.filterdDates.push(dt);
            }
        }


        function openNotesModal(shift) {
            $modal.open({
                templateUrl: '/webapp/management/dispatch/modals/shiftnotes/partial.html',
                controller: 'DispatchDriverNotesController',
                resolve: {
                    rShiftId: function() {
                        return shift.Id
                    },
                    rShiftNotes: function() {
                        return shift.Notes
                    }
                },
                size: 'sm'
            }).result.then(function(notes) {
                shift.Notes = notes;
            });
        }

        function fetchShifts() {
            $scope.fetchingShifts = true;
            var url = "api/drivershift/ShiftStatsFormatted?startDate=" + moment($scope.filter.date.from).format('YYYY-MM-DD') + "&endDate=" + moment($scope.filter.date.to).format('YYYY-MM-DD');
            $http.get($config.API_ENDPOINT + url).then(function (response) {
                splitFilterDays();
                $scope.fetchingShifts = false;
                response.data.map(function(item) {
                    item.$totalTime = 0;
                    item.$totalCommission = 0;
                    $scope.filterdDates.map(function(fd) {
                        item.$totalTime += item.Shifts[fd._date]? item.Shifts[fd._date]:0;
                    });
                    $scope.filterdDates.map(function(fd) {
                        item.$totalCommission += item.Commissions[fd._date]? item.Commissions[fd._date]:0;
                    });
                });
                var totalCommission = 0;
                response.data.map(function(item) {
                    totalCommission += item.$totalCommission;
                });
                $scope.dailyAvg = (totalCommission/response.data.length)/$scope.filterdDates.length;
                $scope.fdAvg = (totalCommission/response.data.length);
                $scope.shifts = response.data;
            }, function (err) {
                $scope.shifts = [];
                swal("Some Error Occurred", err.data.ExceptionMessage, "error");
                $scope.fetchingShifts = false;
            })
        }

        function expandShifts(item, index, day) {
            if (item.$expanded) {
                item.$expanded = null;
                item.$data = [];
            } else {
                item.$expanded = day._uidate;
                item.$data = [];
                var url = "api/drivershift/ShiftsForDriver?startDate=" + day._date + "&endDate=" + moment(day._date).endOf('day').format('YYYY-MM-DDTHH:mm') + "&driverId=" + item.DriverId;
                $http.get($config.API_ENDPOINT + url).then(function (response) {
                    response.data.map(function(dt) {
                        dt.$minutes = moment(dt.ShiftEnd).diff(dt.ShiftStart, 'minutes');
                    })
                    item.$data = response.data;
                }, function () {
                    swal("Error!", "Error Fetching Driver Shifts.", "error");
                });
            }
        }
    }
})(angular);