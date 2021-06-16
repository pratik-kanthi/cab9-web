(function (angular) {
    var module = angular.module('cab9.workshare');
    module.controller('WorksharePartnerDocumentsController', WorksharePartnerDocumentsController);

    WorksharePartnerDocumentsController.$inject = ['$scope', '$config', 'Model', '$http', '$timeout', 'rCompanyProfile'];

    function WorksharePartnerDocumentsController($scope, $config, Model, $http, $timeout, rCompanyProfile) {
        $scope.companyProfile = rCompanyProfile;

        getPartnerDocuments();

        function getPartnerDocuments() {
            Model.Document
                .query()
                .where("OwnerType eq 'Company'")
                .where("OwnerId eq guid'" + $scope.companyProfile.TenantId + "'")
                .include("DocumentType")
                .trackingEnabled()
                .execute().then(function (response) {
                    $scope.documents = response.filter(function (item) {
                        return item.Active
                    });
                });
        }


        $scope.previewDocument = previewDocument;
        $scope.getImagePath = getImagePath;

        function getImagePath(url) {
            if (url.substring(0, 3) == 'api') {
                return window.endpoint + url;
            } else {
                return window.resourceEndpoint + url;
            }
        }

        function previewDocument(doc) {
            window.open($config.RESOURCE_ENDPOINT + doc.FilePath, '_blank');
        }
    }
}(angular));