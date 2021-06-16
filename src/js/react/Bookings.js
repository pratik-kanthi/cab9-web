import React from "react";

const Journey = (props) => {
    return (
        <div className="journey">
            <div className="indicators">
                {props.booking.$pre && <div className="tag pre">PRE</div>}
                <div className={'tag vehicle ' + props.booking.VehicleType.Name}>{props.booking.VehicleType.Name}</div>
                {(props.booking.OfficeNotes || props.booking.DriverNotes || props.booking.PassengerNotes) && <div className="tag notes">
                    <i className="material-icons">speaker_notes</i>Note</div>}
                {props.booking.FlightInfo && <div className="tag flight">
                    <i className="material-icons">airplanemode_active</i>
                    <span>{props.booking.FlightInfo.FlightNumber}</span>

                </div>
}
                {props.booking.new && <div class="tag new">NEW</div>}

            </div>
            <div className="text">
                <strong className="pickup">{props.booking.Summary}</strong>
            </div>
        </div>
    )
}

const Passenger = (props) => {
    return (
        <div className="passenger">

            <div className="text">
                <span>{props.booking.LeadPassenger.Firstname + ' ' + props.booking.LeadPassenger.Surname}</span>
            </div>
            <div className="text">
                <strong>{('(' + props.booking.Client.AccountNo + ') ' + props.booking.Client.Name)}</strong>
            </div>
        </div>
    )
}

const Driver = (props) => {
    function UnconfirmedBooking() {
        return (
            <div>
                {(props.booking.Driver && props.booking.BookingStatus != 'PreAllocated') && <div>
                    <div className="text">
                        <strong>{('(' + props.booking.Driver.Callsign + ')')}</strong>
                        <span>{(props.booking.Driver.Firstname)}</span>
                    </div>
                    {/* <div className="text">
                        <span className="vehicle">{(props.booking.Vehicle._Description + ' ' + props.booking.Vehicle.Registration)}</span>
                    </div> */}
                </div>}
                {(props.booking.Driver && props.booking.BookingStatus == 'PreAllocated') && <div>
                    <div className="text">
                        <strong>{('(' + props.booking.Driver.Callsign + ')')}</strong>
                        <span>{(props.booking.Driver.Firstname)}</span>
                    </div>
                    {props.booking.$offer && <div className="text">
                        {(props.booking.$offer.Status == 'Sent' && props.booking.$offer.Attempts == 1) && <span>Sending..</span>}
                        {(props.booking.$offer.Status == 'Sent' && props.booking.$offer.Attempts > 1) && <span>{'Retrying ' + props.booking.$offer.Attempts - 1 + '..'}</span>}
                        {(props.booking.$offer.Status == 'Read' && !props.booking.$offer.ResponseTime) && <span>Read</span>}
                        {(props.booking.$offer.Status == 'Rejected' && props.booking.$offer.ResponseTime && props.booking.$offer.Accepted == 0) && <span>Driver Rejected!</span>}
                        {(props.booking.$offer.Status == 'Rejected' && !props.booking.$offer.ResponseTime) && <span>Exceeded!</span>}
                    </div>}
                </div>}
            </div>
        )
    }
    return <UnconfirmedBooking/>
}

export default class Bookings extends React.Component {
    constructor(props) {
        super(props)
    }
    componentWillMount() {
        console.log("Component mounting")
    }

    render() {
        return (
            <div>
                {this
                    .props
                    .bookings
                    .map((booking, key) => {
                        return <div>
                            <div className={'booking ' + booking.BookingStatus}>
                                <div className="content-wrapper">
                                    <Journey booking={booking}/>
                                    <Passenger booking={booking}/>
                                    <Driver booking={booking}/>
                                </div>
                            </div>
                        </div>

                    })
}
            </div>

        )
    }
}
