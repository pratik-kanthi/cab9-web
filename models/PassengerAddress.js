(function(angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('PassengerAddress', 'api/PassengerAddresses', {
            Id: {
                type: String,
                editable: false,
                hidden: true
            },
            TenantId: {
                type: String,
                editable: false,
                hidden: true
            },
            StopSummary: {
                type: String
            },
            Name: {
                type: String,
                required: true
            },
            Address1: {
                type: String,
                required: true,
                table: {
                    hidden: true
                }
            },
            Address2: {
                type: String,
                table: {
                    hidden: true
                }
            },
            Area: {
                type: String,
                table: {
                    hidden: true
                }
            },
            TownCity: {
                type: String,
                table: {
                    hidden: true
                }
            },
            County: {
                type: String,
                table: {
                    hidden: true
                }
            },
            Postcode: {
                type: String,
                required: true,
                table: {
                    hidden: true
                }
            },
            Country: {
                type: String,
                table: {
                    hidden: true
                }
            },
            _FullAddress: {
                type: String,
                calculated: function() {
                    var summary = '';
                    summary += this.Address1 ? (this.Address1 + '\n') : '';
                    summary += this.Address2 ? (this.Address2 + '\n') : '';
                    summary += this.Area ? (this.Area + '\n') : '';
                    summary += this.TownCity ? (this.TownCity + '\n') : '';
                    summary += this.Postcode ? (this.Postcode + '\n') : '';
                    summary += this.County ? (this.County + '\n') : '';
                    summary += this.Country ? this.Country : '';
                    return summary;
                },
                display: 'Full Address'
            },
            _Summary: {
                type: String,
                calculated: function() {
                   return window.$utilities.formatAddress(this)
                },
                display: 'Full Address'
            },
            Latitude: {
                type: Number,
                required: false
            },
            Longitude: {
                type: Number,
                required: false
            },
            latitude: {
                type: Number,
                calculated: function() {
                    return this.Latitude;
                }
            },
            longitude: {
                type: Number,
                calculated: function() {
                    return this.Longitude;
                }
            },
            Note: {
                type: String
            },
            PassengerId: {
                type: String,
                required: true,
                displayField: 'Passenger.Id',
                table: {
                    hidden: true
                }
            },
            Passenger: {
                type: 'Passenger',
                ref: 'Passenger',
                refBy: 'PassengerId',
                table: {
                    hidden: true
                }
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