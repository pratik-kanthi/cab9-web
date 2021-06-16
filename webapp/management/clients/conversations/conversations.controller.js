(function () {
    var module = angular.module('cab9.clients');

    module.controller('ConversationsController', conversationsController);

    conversationsController.$inject = ['$scope', '$http', '$config', '$state'];
    function conversationsController($scope, $http, $config, $state) {
        $scope.bookings = [];
        $http.get($config.API_ENDPOINT + 'api/conversations/fetchbyclient', {})
                .success(function (res) {
                    [].push.apply($scope.bookings, res);
                });

        $scope.selectBooking = selectBooking;

        function selectBooking(booking) {
            $state.go('root.clients.conversations.selected', { 'Id': booking.Id });
        }
    }
}())