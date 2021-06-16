(function (window, angular) {
    var module = angular.module('conversationsWindow', [
        "ui.router",
        "framework.services.storage",
        "framework.services.logging",
        "framework.services.auth.persist"
    ])

    module.config(moduleConfig);
    module.run(moduleRun);
    module.controller("ConversationsController", conversationsController);
    module.constant('$config', {
        API_ENDPOINT: window.endpoint
    });

    moduleConfig.$inject = [];
    function moduleConfig() {

    }

    moduleRun.$inject = [];
    function moduleRun() {

    }

    conversationsController.$inject = ['$scope', '$config', '$http'];
    function conversationsController($scope, $config, $http) {
        $scope.conversations = null;
        $scope.drivers = null;
        $scope.currentConversation = null;

        $scope.fetchConversations = fetchConversations;
        $scope.selectConversation = selectConversation;

        function fetchConversations() {
            $http.get($config.API_ENDPOINT + 'api/conversations/myconversations')
                .success(function (data) {
                    $scope.conversations = data;
                });
        }

        function fetchDrivers() {
            $http.get($config.API_ENDPOINT + 'api/drivers')
                .success(function (data) {
                    $scope.drivers = data;
                });
        }

        function selectConversation(convo) {

        }

        fetchDrivers();
    }
}(window, angular));