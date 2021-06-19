(function () {
    var module = angular.module('cab9.clients');

    module.controller('ConversationSelectedController', conversationSelectedController);

    conversationSelectedController.$inject = ['$scope', 'rConversations', 'rBooking','Model','Auth'];
    function conversationSelectedController($scope, rConversations, rBooking, Model, Auth) {
        $scope.booking = rBooking[0];
        $scope.booking.Conversations = rConversations;
        $scope.newMessage = new Model.Conversation();
        $scope.newMessage.BookingId = $scope.booking.Id;
        $scope.newMessage.SenderId = Auth.getSession().UserId;
        console.log(Auth.getSession());
        $scope.newMessage.Type = 'Client';
        $scope.newMessage.Body = '';

        $scope.sendMessage = sendMessage;

        $scope.$on('SIGNALR_newMessage', function (event, args) {
            if (!$scope.booking.Conversations)
                $scope.booking.Conversations = [];
            $scope.booking.Conversations.push(new Model.Conversation(args[0]));
            $scope.$apply();
        });

        function sendMessage() {
            if ($scope.newMessage.Body.length > 0) {
                $scope.newMessage
                    .$save()
                    .success(function () {
                        $scope.newMessage = new Model.Conversation();
                        $scope.newMessage.BookingId = $scope.booking.Id;
                        $scope.newMessage.SenderId = Auth.getSession().UserId;
                        $scope.newMessage.Body = '';
                    })
                    .error(function () { });
            }
        }
    }
}())