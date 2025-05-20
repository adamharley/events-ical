process.env.TZ = 'UTC'

import ical, {ICalCalendarMethod} from 'ical-generator'
import {writeFile} from 'node:fs/promises'
import * as cheerio from 'cheerio'

const url = 'https://www.ucisa.ac.uk/events'

;(async () => {
    const response = await fetch(url)
    const html = await response.text()

    const calendar = ical({name: 'UCISA Events'})
    calendar.method(ICalCalendarMethod.REQUEST)

    const $ = cheerio.load(html)

    for (const card of $('#eventContainer .card')) {
        const url = $(card).find('a').attr('href')

        const response = await fetch('https://www.ucisa.ac.uk/' + url)
        const html = await response.text()

        const $$ = cheerio.load(html)
        const name = $$('h1').text()
        const [date, bookBefore, location] = $$('.detailinfo-box')

        for (const p of $(date).find('p')) {
            const dateText = $(p).text()
        }

        const bookBeforeText = $(bookBefore).find('p').text()
        const locationTextA = $(location).find('h3').text()
        const locationTextB = $(location).find('p').text().trim()
        let startTime, endTime, locationText, m

        // if it's an online event, the first location field should follow this format
        if ((m = /Online (\d{2}:\d{2}) - (\d{2}:\d{2})/.exec(locationTextA)) !== null) {
            startTime = m[1]
            endTime = m[2]
            locationText = locationTextB
        } else {
            locationText = locationTextA + "\n" + locationTextB
        }

        let about = []

        for (const p of $$('.AboutEvents p')) {
            about.push($$(p).text())
        }

        const aboutText = about.join("\n")
 
        calendar.createEvent({
            start: dates[1] + ' ' + dates[3],
            end: dates[2] + ' ' + dates[3],
            summary: name,
            description: aboutText,
            location: locationText,
            url: url,
            allDay: !startTime,
        })

        console.log({name, aboutText, bookBeforeText, locationText, startTime, endTime})
        return
    }
})()