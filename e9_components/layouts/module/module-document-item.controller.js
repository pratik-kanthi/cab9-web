(function (angular) {
    var module = angular.module('framework.UI.module');

    module.controller('ModuleDocumentItemEditController', moduleDocumentItemEditController);
    module.controller('ModuleDocumentItemNewController', moduleDocumentItemNewController);

    moduleDocumentItemEditController.$inject = ['$scope', '$state', 'rDocument', 'rDocumentTypes', 'FileUpload', '$modalInstance'];

    function moduleDocumentItemEditController($scope, $state, rDocument, rDocumentTypes, FileUpload, $modalInstance) {
        $scope.document = rDocument;
        $scope.documentTypes = rDocumentTypes;

        $scope.progress = null;
        $scope.document.file = null;
        $scope.viewMode = "EDIT";
        $scope.saveDocument = saveDocument;

        function saveDocument() {
            $scope.progress = 0;
            if (this.document.file) {

                FileUpload.update(this.document.file, this.document)
                .then(function (document) {
                    $modalInstance.close(document);
                    swal("Document Updated!", "Document has been Updated.", "success");
                    $state.go($state.current, {}, {
                        reload: true
                    });
                }, function (error) {
                    swal({
                        title: "An Error Occured!",
                        text: "Document has not been Uploaded.",
                        type: "error"
                    });
                    $scope.progress = null;
                }, function (percent) {
                    $scope.progress = percent;
                });
            } else {
                this.document.$patch().then(function (response) {
                    $modalInstance.close(response.data);
                    swal("Document Updated!", "Document Info has been Updated.", "success");
                    $state.go($state.current, {}, {
                        reload: true
                    });
                }, function (error) {
                    swal({
                        title: "An Error Occured!",
                        text: "Document has not been Uploaded.",
                        type: "error"
                    });
                    $scope.progress = null;
                }, function (percent) {
                    $scope.progress = percent;
                });
            }
        }
    }

    moduleDocumentItemNewController.$inject = ['$scope', 'Model', 'rData', 'rDocumentTypes', 'FileUpload', '$modalInstance'];

    function moduleDocumentItemNewController($scope, Model, rData, rDocumentTypes, FileUpload, $modalInstance) {
        $scope.document = {};
        $scope.documentTypes = rDocumentTypes;
        $scope.document.file = null;
        $scope.document.Active = true;
        $scope.document.OwnerType = rData.OwnerType;
        $scope.document.OwnerId = rData.OwnerId;
        $scope.viewMode = "CREATE";
        $scope.progress = null;

        $scope.saveDocument = saveDocument;

        function saveDocument() {
            $scope.progress = 0;
            FileUpload.upload(this.document.file, this.document)
                .then(function (document) {
                    document = new Model.Document(document);
                    document.DocumentType = $scope.documentTypes.filter(function (item) {
                        return item.Id == document.DocumentTypeId
                    })[0]
                    $modalInstance.close(document);
                }, function (error) {
                    swal({
                        title: "An Error Occured!",
                        text: "Document has not been Uploaded.",
                        type: "error"
                    });
                    $scope.progress = null;
                }, function (percent) {
                    $scope.progress = percent;
                });
        }

    }


})(angular);