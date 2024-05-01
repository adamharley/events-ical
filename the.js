process.env.TZ = 'UTC'

import ical, {ICalCalendarMethod} from 'ical-generator'
import {writeFile} from 'node:fs/promises'
import * as cheerio from 'cheerio'

const url = 'https://www.timeshighereducation.com/events/upcoming'

;(async () => {
    const response = await fetch(url)
    const html = await response.text()

    const calendar = ical({name: 'THE Events'})
    calendar.method(ICalCalendarMethod.REQUEST)

    const $ = cheerio.load(html)

    for (const teaser of $('.summit-teaser')) {
        const dates = $(teaser).find('.article__date').text().match(/(\d{1,2} \w+) - (\d{1,2} \w+) (\d{4})/)
 
        calendar.createEvent({
            start: dates[1] + ' ' + dates[3],
            end: dates[2] + ' ' + dates[3],
            summary: $(teaser).find('.summit-teaser__title').text().trim().replace(/ 20\d{2}$/, ''),
            description: $(teaser).find('.summit-teaser__strapline').text().trim().replace(/\n/g, "\n\n"),
            location: $(teaser).find('.summit-teaser__location').text().trim(),
            url: $(teaser).find('a').attr('href'),
            allDay: true,
        })
    }

    await writeFile('webroot/the.ics', calendar.toString())
})()