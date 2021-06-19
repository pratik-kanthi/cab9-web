(function(angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('PassengerStop', 'api/PassengerStop', {
            Id: {
                type: String,
            },
            TenantId: {
                type: String,
            },
            PassengerId: {
                type: String,
            },
            Passenger: {
                type: 'Passenger',
            },
            BookingStopId: {
                type: String,
            },
            BookingStop: {
                type: 'BookingStop',
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

        ModelProvider.registerSchema('BookingStop', 'api/bookingstops', {
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
            Type: {
                type: String,
                enum: ['PickUp', 'Via', 'StopAndWait', 'DropOff']
            },
            LocationType: {
                type: String,
                enum: ['TRAINSTATION', 'TUBESTATION', 'AIRPORT', 'OFFICE', 'OTHER']
            },
            StopOrder: {
                type: Number,
                required: false
            },
            WaitTime: {
                type: Number,
                required: false
            },
            WaitTimeChargable: {
                type: Number,
                required: false
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
                required: true,
                table: {
                    hidden: true
                }
            },
            Area: {
                type: String,
                required: true,
                table: {
                    hidden: true
                }
            },
            TownCity: {
                type: String,
                required: true,
                table: {
                    hidden: true
                }
            },
            County: {
                type: String,
                required: true,
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
                required: true,
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
            BookingId: {
                type: String,
                required: true,
                displayField: 'Booking.Id',
                table: {
                    hidden: true
                }
            },
            Booking: {
                type: 'Booking',
                ref: 'Booking',
                refBy: 'BookingId',
                table: {
                    hidden: true
                }
            },
            PassengerStops: {
                type: ['PassengerStop'],
                defaultValue: [],
                table: {
                    hidden: true
                }
            },
            _WaitingTimeCharges: {
                type: Number,
                calculated: function() {
                    if (this.WaitTimeChargable && this.WaitTime)
                        return (this.WaitTimeChargable * this.WaitTime);
                    else
                        return 0;
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