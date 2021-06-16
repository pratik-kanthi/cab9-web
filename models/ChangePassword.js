(function(angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('ChangePassword', '', {
            UserName: {
                type: String,
                required: true
            },
            CurrentPassword: {
                type: String,
                required: true,
                inputType: 'password'
            },
            NewPassword: {
                type: String,
                required: true,
                inputType: 'password'
            },
            NewPasswordRepeat: {
                type: String,
                required: true,
                inputType: 'password'
            },
            CreationTime: {
                type: moment,
                display: 'Creation Time',
                table: {
                    hidden: true
                }
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
                display: 'Modification Time',
                table: {
                    hidden: true
                }
            }
        });
    }
})(angular);