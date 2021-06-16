(function () {
    var module = angular.module('cab9.common');

    module.controller('ConversationsModalController', conversationsModalController);


    conversationsModalController.$inject = ['$scope', '$config', '$http', 'rBooking', 'Model', 'Auth', 'rType'];

    function conversationsModalController($scope, $config, $http, rBooking, Model, Auth, rType) {
        $scope.booking = rBooking;
        $scope.fetched = 0;
        Model[rType + "Type"].query().execute().then(function (response) {
            $scope.roles = response;
            fetchConversations();
        }, function (err) {
            swal({
                title: "Some Error Occured.",
                text: "Some error has occured.",
                type: "error",
                confirmButtonColor: $UI.COLOURS.brandSecondary
            });
        })
        $scope.session = Auth.getSession();
        $scope.isItAUserMessage = isItAUserMessage;
        $scope.newMessage = new Model.Conversation();
        $scope.newMessage.BookingId = $scope.booking.Id;
        $scope.newMessage.SenderId = Auth.getSession().UserId;
        console.log(Auth.getSession());
        $scope.newMessage.Type = rType;
        $scope.newMessage.Body = '';

        $scope.sendMessage = sendMessage;

        $scope.$on('SIGNALR_newMessage', function (event, args) {
            if (!$scope.booking.Conversations)
                $scope.booking.Conversations = [];
            $scope.booking.Conversations.push(new Model.Conversation(args[0]));
            $scope.$apply();
        });

        function isItAUserMessage(conversation) {
            if (conversation.Sender.UserName == $scope.session.UserName)
                return true;
            else
                return false;
        }

        function fetchConversations() {
            Model.Conversation
                .query()
                .filter('BookingId', '==', "guid'" + $scope.booking.Id + "'")
                .filter("Type eq '" + rType + "'")
                .include("Sender/Claims,Booking/" + rType)
                .trackingEnabled()
                .execute()
                .then(function (data) {
                    $scope.booking.Conversations = data;
                    $scope.booking.Conversations = $scope.booking.Conversations.map(function (item) {
                        for (i = 0, len = $scope.roles.length; i < len; i++) {
                            if ($scope.roles[i].Id == item.Booking[rType][rType + "TypeId"]) {
                                item.Booking[rType][rType + "Type"] = $scope.roles[i]
                                break;
                            }
                        }
                        return item;
                    })
                    $scope.fetched = 1;
                    setTimeout(function () {
                        $('.conversation').scrollTop($('.conversations-wrapper').height());
                    }, 100);
                });
        }

        function sendMessage() {
            if ($scope.newMessage.Body.length > 0) {
                $scope.newMessage
                    .$save()
                    .success(function () {
                        //                        fetchConversations();
                        $scope.newMessage = new Model.Conversation();
                        $scope.newMessage.BookingId = $scope.booking.Id;
                        $scope.newMessage.SenderId = Auth.getSession().UserId;
                        $scope.newMessage.Body = '';
                    })
                    .error(function () {});
            }
        }
    }

}());