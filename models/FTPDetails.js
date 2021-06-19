(function(angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('FTPDetails', 'api/ftpdetails', {
            Id: {
                type: String,
                hidden: true
            },
            TenantId: {
                type: String,
                editable: false,
                hidden: true
            },
            Host: {
                type: String,
                required: true
            },
            Username: {
                type: String,
                required: true
            },
            Password: {
                type: String,
                required: true
            },
            SFTP: {
                type: Boolean
            },
            FolderPath: {
                type: String
            },
            CreationTime: {
                type: moment,
                display: 'Creation Time'
            },
            ModificationUserId: {
                type: String,
                table: {
                    hidden: true
                }
            },
            CreationUserId: {
                type: String,
                table: {
                    hidden: true
                }
            },
            ModificationTime: {
                type: moment,
                display: 'Modification Time'
            }
        });
    }
})(angular);