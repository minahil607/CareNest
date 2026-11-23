package com.carecircle.app

import com.carecircle.app.ui.components.CareFormatters
import org.junit.Assert.assertEquals
import org.junit.Test

class CareFormattersTest {

    @Test
    fun formatTime_formatsMorningAndEvening() {
        assertEquals("8:00 AM", CareFormatters.formatTime(8, 0))
        assertEquals("12:30 PM", CareFormatters.formatTime(12, 30))
        assertEquals("9:05 PM", CareFormatters.formatTime(21, 5))
    }

    @Test
    fun greetingForHour_returnsExpectedGreeting() {
        assertEquals("Good morning", CareFormatters.greetingForHour(8))
        assertEquals("Good afternoon", CareFormatters.greetingForHour(14))
        assertEquals("Good evening", CareFormatters.greetingForHour(20))
    }
}
