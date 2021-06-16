(function(angular) {
    var module = angular.module('cab9.bookings');

    module.controller('CallsController', callsController);

    callsController.$inject = ['$scope', '$modal', 'Model', '$q', '$http', '$config', '$rootScope', '$compile', '$timeout', 'Notification', '$filter', 'rStaff'];

    function callsController($scope, $modal, Model, $q, $http, $config, $rootScope, $compile, $timeout, Notification, $filter, rStaff) {
        $scope.showStartTime = false;
        $scope.showEndTime = false;
        $scope.staff = rStaff;

        $scope.Calls = [];
        $scope.searchCalls = [];
        $scope.searchTerm = 'hi';
        $scope.opened = {};


        $scope.paging = {
            currentPage: 1,
            resultsPerPage: 20,
            totalResults: null,
            maxPages: null,
            loading: true,
        };

        $scope.filters = {
            $startDate: new moment().add(-6, "days").toDate(),
            $startTime: new moment().add(-6, "days").startOf("hour").toDate(),
            $endDate: new moment().toDate(),
            $endTime: new moment().startOf("hour").toDate(),
            startDateTime: moment().add(-1, "days").format("YYYY-MM-DDTHH:mm"),
            endDateTime: moment().format("YYYY-MM-DDTHH:mm"),
            staffId: null,
            minDurationCall: null,
            minDurationRinging: null,
            pageNum: 1,
            records: 20
        };


        $scope.fetchCalls = fetchCalls;
        $scope.openCalendar = openCalendar;
        $scope.expandCall = expandCall;
        $scope.searchStaff = searchStaff;
        $scope.clearFilters = clearFilters;

        Model.TelephonyIntegration.query().execute().then(function(data) {
            if(data && data.length > 0) {
                $scope.noTelephonySet = false;
                fetchCalls(1);
            } else {
                $scope.noTelephonySet = true;
            }
        });

        

        function searchStaff(searchText) {
            if (searchText && searchText.length > 2) {
                $scope.fetchedStaff = $filter('filter')($scope.staff, {
                    Name: searchText
                });
            } else {
                $scope.fetchedStaff = [];
            }
        }

        function fetchCalls(pageNum) {
            $scope.paging.loading = true;
            $scope.paging.currentPage = pageNum;
            $scope.filters.pageNum = pageNum;
            $scope.filters.startDateTime = getDate($scope.filters.$startDate, $scope.filters.$startTime);
            $scope.filters.endDateTime = getDate($scope.filters.$endDate, $scope.filters.$endTime);

            var filterObj = angular.copy($scope.filters);

            $http.get($config.API_ENDPOINT + '/api/calls/all', {
                params: filterObj
            }).success(function(data) {
                console.log(data);
                $scope.paging.loading = false;
                $scope.paging.totalResults = data.Stats.Calls;
                $scope.paging.maxPages = Math.ceil($scope.paging.totalResults / $scope.paging.resultsPerPage);
                console.log(data.Stats);
                $scope.stats = data.Stats;
                $scope.Calls = data.Calls;
                $scope.Calls.map(function(call) {
                    call.$StartTime = moment(call.StartTime);
                    call.$AnsweredTime = moment(call.AnsweredTime);
                    call.$EndTime = moment(call.EndTime);
                    call.$RingingDuration = call.$AnsweredTime.diff(call.$StartTime, 'seconds');
                    call.$CallDuration = call.$EndTime.diff(call.$AnsweredTime, 'seconds');
                })
            }).error(function(error) {
                $scope.paging.loading = false;
                swal("Error", error.Message, "error");
            });

        }

        function clearFilters() {
            $scope.filters = {
                $startDate: new moment().add(-1, "days").toDate(),
                $startTime: new moment().add(-1, "days").startOf("minute").toDate(),
                $endDate: new moment().toDate(),
                $endTime: new moment().startOf("minute").toDate(),
                startDateTime: moment().add(-1, "days").format("YYYY-MM-DDTHH:mm"),
                endDateTime: moment().format("YYYY-MM-DDTHH:mm"),
                staffId: null,
                minDurationCall: null,
                minDurationRinging: null,
                pageNum: 1,
                records: 20
            };
        }

        function expandCall(call) {
            call.$Expanded = true;
        }

        function openCalendar(event, name) {
            $scope.opened[name] = true;
            event.preventDefault();
            event.stopPropagation();
        }

        function getDate(date, time) {
            if (!date) {
                date = new Date();
            }
            var year = date.getFullYear();
            var month = date.getMonth();
            var day = date.getDate();
            var hours = time.getHours();
            var minutes = time.getMinutes();

            var format = pad(year, 4) + '-' + pad(month + 1, 2) + '-' + pad(day, 2) + 'T' + pad(hours, 2) + ':' + pad(minutes, 2) + ':00';

            return format;

            function pad(num, size) {
                var s = "000000000" + num;
                return s.substr(s.length - size);
            }
        }



    }
})(angular);