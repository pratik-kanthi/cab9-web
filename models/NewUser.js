(function(angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('NewUser', '', {
            UserName: {
                type: String,
                required: true
            },
            Password: {
                type: String,
                required: true,
                inputType: 'password'
            },
            PasswordRepeat: {
                type: String,
                required: true,
                inputType: 'password',
                display: 'Password Repeat'
            },
            Email: {
                type: String,
                required: true
            },
            PhoneNumber: {
                type: "Phone"
            },
            DriverId: {
                type: String
            },
            ClientId: {
                type: String
            },
            PassengerId: {
                type: String
            },
            StaffId: {
                type: String
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