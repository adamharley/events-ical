import ical, {ICalCalendarMethod} from 'ical-generator'
import {writeFile} from 'node:fs/promises'

const endpointUrl = 'https://aws-experience.com/emea/uki/api/'
const eventUrl = 'https://aws-experience.com/emea/uki/e/'

function camelCase(str) {
    return str.charAt(0).toUpperCase() + str.replace(/([a-z])([A-Z])/g, '$1 $2').slice(1)
}

;(async () => {
    const responses = await Promise.all([
        fetch(endpointUrl + 'externalevent'),
        fetch(endpointUrl + 'session')
    ])
    const json = await Promise.all(responses.map(response => response.json()))
    const events = []
        .concat(json[0].future, json[0].past, json[1].future, json[1].past)
        .filter(event => !event.language && event.status == 'live')

    const calendar = ical({name: 'AWS UK & Ireland'})
    calendar.method(ICalCalendarMethod.REQUEST)

    for (const event of events) {
        const url = eventUrl + event.urlSlug
        const description = event.summary.trim().replace(/(\S)\n(\S)/g, "$1\n\n$2") + "\n\n" + url
        let location

        if (event.settingDetails[0].setting == 'virtual') {
            location = 'Online'
        } else if (event.settingDetails[0].details.address) {
            location = event.settingDetails[0].details.address
        } else {
            location = camelCase(event.settingDetails[0].details.location.id)
        }

        calendar.createEvent({
            start: new Date(event.startWithTimeZone),
            end: new Date(event.endWithTimeZone),
            summary: event.title.trim(),
            description,
            location,
            url,
            categories: [{name: camelCase(event.type)}],
            created: new Date(event.createdDate),
            lastModified: new Date(event.modifiedDate),
            id: event.id,
            x: {
                "X-tags": event.tags.sort().join(', '),
                "X-presenter": event.presenter.trim(),
                "X-audienceTypes": event.audienceTypes.sort().map(camelCase).join(', '),
                "X-levels": event.levels ? event.levels.sort().join(', ') : '',
                "X-setting": camelCase(event.settingDetails[0].setting),
                "X-registrationUrl": event.registrationUrl ? event.registrationUrl : '',
            }
        })
    }

    await writeFile('webroot/aws.ics', calendar.toString())
})()
