const mongoose = require('mongoose');
const Score = require('../models/Score');
require('dotenv').config();

// Helper function to get country from timezone (same as in scoreController.js)
function getCountryFromTimezone(timezone) {
    // Common timezone to country mappings
    const timezoneToCountry = {
        // Asia
        'Asia/Bangkok': 'Thailand',
        'Asia/Singapore': 'Singapore',
        'Asia/Kuala_Lumpur': 'Malaysia',
        'Asia/Manila': 'Philippines',
        'Asia/Jakarta': 'Indonesia',
        'Asia/Ho_Chi_Minh': 'Vietnam',
        'Asia/Seoul': 'South Korea',
        'Asia/Tokyo': 'Japan',
        'Asia/Shanghai': 'China',
        'Asia/Hong_Kong': 'Hong Kong',
        'Asia/Taipei': 'Taiwan',
        'Asia/Kolkata': 'India',
        'Asia/Karachi': 'Pakistan',
        'Asia/Dhaka': 'Bangladesh',
        'Asia/Istanbul': 'Turkey',
        'Asia/Dubai': 'United Arab Emirates',
        'Asia/Riyadh': 'Saudi Arabia',
        'Asia/Qatar': 'Qatar',
        'Asia/Kuwait': 'Kuwait',
        'Asia/Bahrain': 'Bahrain',
        'Asia/Muscat': 'Oman',
        'Asia/Tehran': 'Iran',
        'Asia/Baghdad': 'Iraq',
        'Asia/Amman': 'Jordan',
        'Asia/Beirut': 'Lebanon',
        'Asia/Jerusalem': 'Israel',
        'Asia/Baku': 'Azerbaijan',
        'Asia/Tbilisi': 'Georgia',
        'Asia/Yerevan': 'Armenia',
        'Asia/Almaty': 'Kazakhstan',
        'Asia/Tashkent': 'Uzbekistan',
        'Asia/Ashgabat': 'Turkmenistan',
        'Asia/Dushanbe': 'Tajikistan',
        'Asia/Bishkek': 'Kyrgyzstan',
        'Asia/Ulaanbaatar': 'Mongolia',
        'Asia/Phnom_Penh': 'Cambodia',
        'Asia/Vientiane': 'Laos',
        'Asia/Yangon': 'Myanmar',
        'Asia/Kathmandu': 'Nepal',
        'Asia/Colombo': 'Sri Lanka',
        'Asia/Thimphu': 'Bhutan',
        'Asia/Male': 'Maldives',

        // Europe
        'Europe/London': 'United Kingdom',
        'Europe/Paris': 'France',
        'Europe/Berlin': 'Germany',
        'Europe/Madrid': 'Spain',
        'Europe/Rome': 'Italy',
        'Europe/Amsterdam': 'Netherlands',
        'Europe/Brussels': 'Belgium',
        'Europe/Zurich': 'Switzerland',
        'Europe/Vienna': 'Austria',
        'Europe/Stockholm': 'Sweden',
        'Europe/Oslo': 'Norway',
        'Europe/Copenhagen': 'Denmark',
        'Europe/Helsinki': 'Finland',
        'Europe/Warsaw': 'Poland',
        'Europe/Prague': 'Czechia',
        'Europe/Budapest': 'Hungary',
        'Europe/Bucharest': 'Romania',
        'Europe/Sofia': 'Bulgaria',
        'Europe/Athens': 'Greece',
        'Europe/Lisbon': 'Portugal',
        'Europe/Dublin': 'Ireland',
        'Europe/Riga': 'Latvia',
        'Europe/Vilnius': 'Lithuania',
        'Europe/Tallinn': 'Estonia',
        'Europe/Kiev': 'Ukraine',
        'Europe/Minsk': 'Belarus',
        'Europe/Moscow': 'Russia',
        'Europe/Istanbul': 'Turkey',
        'Europe/Zagreb': 'Croatia',
        'Europe/Ljubljana': 'Slovenia',
        'Europe/Bratislava': 'Slovakia',
        'Europe/Belgrade': 'Serbia',
        'Europe/Sarajevo': 'Bosnia and Herzegovina',
        'Europe/Skopje': 'North Macedonia',
        'Europe/Tirana': 'Albania',
        'Europe/Podgorica': 'Montenegro',
        'Europe/Reykjavik': 'Iceland',

        // Americas
        'America/New_York': 'United States',
        'America/Los_Angeles': 'United States',
        'America/Chicago': 'United States',
        'America/Denver': 'United States',
        'America/Phoenix': 'United States',
        'America/Anchorage': 'United States',
        'America/Adak': 'United States',
        'America/Honolulu': 'United States',
        'America/Toronto': 'Canada',
        'America/Vancouver': 'Canada',
        'America/Edmonton': 'Canada',
        'America/Winnipeg': 'Canada',
        'America/Halifax': 'Canada',
        'America/St_Johns': 'Canada',
        'America/Mexico_City': 'Mexico',
        'America/Tijuana': 'Mexico',
        'America/Merida': 'Mexico',
        'America/Monterrey': 'Mexico',
        'America/Guatemala': 'Guatemala',
        'America/El_Salvador': 'El Salvador',
        'America/Tegucigalpa': 'Honduras',
        'America/Managua': 'Nicaragua',
        'America/Costa_Rica': 'Costa Rica',
        'America/Panama': 'Panama',
        'America/Bogota': 'Colombia',
        'America/Lima': 'Peru',
        'America/Caracas': 'Venezuela',
        'America/La_Paz': 'Bolivia',
        'America/Quito': 'Ecuador',
        'America/Guayaquil': 'Ecuador',
        'America/Asuncion': 'Paraguay',
        'America/Montevideo': 'Uruguay',
        'America/Argentina/Buenos_Aires': 'Argentina',
        'America/Santiago': 'Chile',
        'America/Sao_Paulo': 'Brazil',
        'America/Rio_Branco': 'Brazil',
        'America/Manaus': 'Brazil',
        'America/Belem': 'Brazil',
        'America/Fortaleza': 'Brazil',
        'America/Recife': 'Brazil',
        'America/Araguaina': 'Brazil',
        'America/Maceio': 'Brazil',
        'America/Bahia': 'Brazil',
        'America/Sao_Paulo': 'Brazil',
        'America/Campo_Grande': 'Brazil',
        'America/Cuiaba': 'Brazil',
        'America/Porto_Velho': 'Brazil',
        'America/Boa_Vista': 'Brazil',
        'America/Manaus': 'Brazil',
        'America/Eirunepe': 'Brazil',
        'America/Rio_Branco': 'Brazil',

        // Africa
        'Africa/Cairo': 'Egypt',
        'Africa/Johannesburg': 'South Africa',
        'Africa/Lagos': 'Nigeria',
        'Africa/Nairobi': 'Kenya',
        'Africa/Addis_Ababa': 'Ethiopia',
        'Africa/Dar_es_Salaam': 'Tanzania',
        'Africa/Kampala': 'Uganda',
        'Africa/Khartoum': 'Sudan',
        'Africa/Algiers': 'Algeria',
        'Africa/Casablanca': 'Morocco',
        'Africa/Tunis': 'Tunisia',
        'Africa/Tripoli': 'Libya',
        'Africa/Accra': 'Ghana',
        'Africa/Dakar': 'Senegal',
        'Africa/Abidjan': 'Ivory Coast',
        'Africa/Luanda': 'Angola',
        'Africa/Maputo': 'Mozambique',
        'Africa/Harare': 'Zimbabwe',
        'Africa/Lusaka': 'Zambia',
        'Africa/Gaborone': 'Botswana',
        'Africa/Windhoek': 'Namibia',
        'Africa/Maseru': 'Lesotho',
        'Africa/Mbabane': 'Eswatini',
        'Africa/Mogadishu': 'Somalia',
        'Africa/Asmara': 'Eritrea',
        'Africa/Djibouti': 'Djibouti',
        'Africa/Conakry': 'Guinea',
        'Africa/Bamako': 'Mali',
        'Africa/Ouagadougou': 'Burkina Faso',
        'Africa/Niamey': 'Niger',
        'Africa/Ndjamena': 'Chad',
        'Africa/Bangui': 'Central African Republic',
        'Africa/Brazzaville': 'Republic of the Congo',
        'Africa/Kinshasa': 'Democratic Republic of the Congo',
        'Africa/Libreville': 'Gabon',
        'Africa/Malabo': 'Equatorial Guinea',
        'Africa/Sao_Tome': 'Sao Tome and Principe',
        'Africa/Douala': 'Cameroon',
        'Africa/Yaounde': 'Cameroon',
        'Africa/Banjul': 'Gambia',
        'Africa/Bissau': 'Guinea-Bissau',
        'Africa/Freetown': 'Sierra Leone',
        'Africa/Monrovia': 'Liberia',
        'Africa/Porto-Novo': 'Benin',
        'Africa/Lome': 'Togo',
        'Africa/Nouakchott': 'Mauritania',
        'Africa/El_Aaiun': 'Western Sahara',

        // Oceania
        'Australia/Sydney': 'Australia',
        'Australia/Melbourne': 'Australia',
        'Australia/Brisbane': 'Australia',
        'Australia/Adelaide': 'Australia',
        'Australia/Perth': 'Australia',
        'Australia/Darwin': 'Australia',
        'Australia/Hobart': 'Australia',
        'Pacific/Auckland': 'New Zealand',
        'Pacific/Fiji': 'Fiji',
        'Pacific/Guam': 'Guam',
        'Pacific/Port_Moresby': 'Papua New Guinea',
        'Pacific/Honolulu': 'United States',
        'Pacific/Pago_Pago': 'American Samoa',
        'Pacific/Palau': 'Palau',
        'Pacific/Chuuk': 'Micronesia',
        'Pacific/Pohnpei': 'Micronesia',
        'Pacific/Kosrae': 'Micronesia',
        'Pacific/Majuro': 'Marshall Islands',
        'Pacific/Kwajalein': 'Marshall Islands',
        'Pacific/Nauru': 'Nauru',
        'Pacific/Tarawa': 'Kiribati',
        'Pacific/Enderbury': 'Kiribati',
        'Pacific/Kiritimati': 'Kiribati',
        'Pacific/Tongatapu': 'Tonga',
        'Pacific/Apia': 'Samoa',
        'Pacific/Fakaofo': 'Tokelau',
        'Pacific/Wallis': 'Wallis and Futuna',
        'Pacific/Funafuti': 'Tuvalu',
        'Pacific/Niue': 'Niue',
        'Pacific/Norfolk': 'Norfolk Island',
        'Pacific/Pitcairn': 'Pitcairn Islands',
        'Pacific/Rarotonga': 'Cook Islands',
        'Pacific/Noumea': 'New Caledonia',
        'Pacific/Port_Vila': 'Vanuatu',
        'Pacific/Guadalcanal': 'Solomon Islands'
    };

    return timezoneToCountry[timezone] || 'Unknown';
}

async function updateUnknownCountries() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        // Find all scores with unknown country
        const scores = await Score.find({ 'playerData.country': 'Unknown' });
        console.log(`Found ${scores.length} scores with unknown country`);

        let updatedCount = 0;
        let failedCount = 0;

        // Update each score
        for (const score of scores) {
            try {
                if (score.playerData && score.playerData.timezone) {
                    const country = getCountryFromTimezone(score.playerData.timezone);
                    if (country !== 'Unknown') {
                        score.playerData.country = country;
                        await score.save();
                        console.log(`Updated score ${score._id} with country: ${country}`);
                        updatedCount++;
                    } else {
                        console.log(`Could not determine country for timezone: ${score.playerData.timezone}`);
                        failedCount++;
                    }
                } else {
                    console.log(`Score ${score._id} has no timezone information`);
                    failedCount++;
                }
            } catch (error) {
                console.error(`Error updating score ${score._id}:`, error);
                failedCount++;
            }
        }

        console.log('\nUpdate Summary:');
        console.log(`Total scores processed: ${scores.length}`);
        console.log(`Successfully updated: ${updatedCount}`);
        console.log(`Failed to update: ${failedCount}`);

        process.exit(0);
    } catch (error) {
        console.error('Error updating unknown countries:', error);
        process.exit(1);
    }
}

// Run the update function
updateUnknownCountries(); 