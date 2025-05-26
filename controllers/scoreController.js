const Score = require('../models/Score');
const User = require('../models/User');

// Helper function to get country from timezone
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

// Create a new score
exports.createScore = async (req, res) => {
    try {
        console.log('Creating new score with data:', req.body);
        console.log('User data:', req.user);

        // Get score, percentage, and timezone from request body
        const { score, percentage, timezone } = req.body;
        
        // Get userId and user data from authenticated user
        const userId = req.user._id;
        const { name, email } = req.user;

        // Validate required fields
        if (score === undefined || percentage === undefined || !userId || !timezone) {
            console.error('Missing required fields:', { score, percentage, userId, timezone });
            return res.status(400).json({ 
                message: 'Score, percentage, timezone, and user ID are required.',
                received: { score, percentage, userId, timezone }
            });
        }

        // Validate score and percentage
        if (typeof score !== 'number' || score < 0) {
            return res.status(400).json({ message: 'Score must be a positive number' });
        }
        if (typeof percentage !== 'number' || percentage < 0) {
            return res.status(400).json({ message: 'Percentage must be a number between 0 and 100' });
        }

        // Determine country from timezone
        const country = getCountryFromTimezone(timezone);
        console.log('Determined country:', country, 'from timezone:', timezone);

        // Always update user's country and timezone
        await User.findByIdAndUpdate(userId, { 
            country,
            timezone,
            name: name || req.user.name,
            email: email || req.user.email
        });
        console.log('Updated user data:', { country, timezone, name, email });

        // Create player data object with all required fields
        const playerData = {
            name: name || req.user.name || 'Anonymous',
            email: email || req.user.email || 'anonymous@example.com',
            country: country,
            timezone: timezone,
            score: score,
            percentage: percentage,
            timestamp: new Date()
        };

        console.log('Creating score with player data:', playerData);

        // Create new score document
        const newScore = new Score({
            score,
            percentage,
            userId,
            playerData
        });

        // Validate the score document before saving
        const validationError = newScore.validateSync();
        if (validationError) {
            console.error('Score validation error:', validationError);
            return res.status(400).json({ 
                message: 'Invalid score data', 
                errors: validationError.errors 
            });
        }

        // Save to test.scores collection
        const savedScore = await newScore.save();
        console.log('Score saved successfully to test.scores:', savedScore);

        // Populate user details
        const scoreWithUser = await savedScore.populate('userId', 'name country');
        console.log('Score with populated user:', scoreWithUser);

        // Emit real-time update
        const io = req.app.get('io');
        if (io) {
            // Emit the new score
            io.emit('newScore', scoreWithUser);
            
            // Fetch and emit updated country totals
            const countryTotals = await Score.aggregate([
                {
                    $match: {
                        'playerData.country': { $exists: true, $ne: null }
                    }
                },
                {
                    $group: {
                        _id: '$playerData.country',
                        totalScore: { $sum: '$score' }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        country: '$_id',
                        totalScore: 1
                    }
                },
                {
                    $sort: { totalScore: -1 }
                }
            ]);
            io.emit('countryTotalsUpdate', countryTotals);
        }

        res.status(201).json(scoreWithUser);
    } catch (error) {
        console.error('Error creating score:', error);
        res.status(500).json({ 
            message: 'Failed to create score.', 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Get all scores with pagination and sorting
exports.getScores = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const sortBy = req.query.sortBy || 'score';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

        const scores = await Score.find()
            .populate('userId', 'name country') // Populate user details
            .sort({ [sortBy]: sortOrder })
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await Score.countDocuments();

        res.json({
            scores,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalScores: total
        });
    } catch (error) {
        console.error('Error getting scores:', error);
        res.status(500).json({ message: 'Failed to retrieve scores.', error: error.message });
    }
};

// Get scores by country
exports.getScoresByCountry = async (req, res) => {
    try {
        const { country } = req.params;
        // Find users by country, then find scores for those users
        // This is less efficient; a better approach might be needed depending on scale
        // For now, let's assume we can filter scores by populating and matching country
        // A more performant solution would involve denormalization or aggregation
        const scores = await Score.find()
            .populate({
                path: 'userId',
                match: { country: country },
                select: 'name country'
            })
            .sort({ score: -1 })
            .limit(10);

        // Filter out scores where population failed (user not found or no country match)
        const filteredScores = scores.filter(score => score.userId !== null);

        res.json(filteredScores);
    } catch (error) {
        console.error('Error getting scores by country:', error);
        res.status(500).json({ message: 'Failed to retrieve scores by country.', error: error.message });
    }
};

// Get user's highest score
exports.getUserHighestScore = async (req, res) => {
    try {
        // Assuming the route is protected and req.user contains the user
        const userId = req.user._id;

        const score = await Score.findOne({ userId })
            .populate('userId', 'name country')
            .sort({ score: -1 });

        if (!score) {
            return res.status(404).json({ message: 'No score found for this user' });
        }

        res.json(score);
    } catch (error) {
        console.error('Error getting user highest score:', error);
        res.status(500).json({ message: 'Failed to retrieve user highest score.', error: error.message });
    }
};

// Get top scores globally
exports.getTopScores = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const scores = await Score.find()
            .populate('userId', 'name country') // Populate user details
            .sort({ score: -1 })
            .limit(limit);

        res.json(scores);
    } catch (error) {
        console.error('Error getting top scores:', error);
        res.status(500).json({ message: 'Failed to retrieve top scores.', error: error.message });
    }
};

// Get total scores by country
exports.getCountryTotals = async (req, res) => {
    try {
        console.log('Fetching country totals...');
        
        // First check if we have any scores
        const totalScores = await Score.countDocuments();
        console.log('Total scores in database:', totalScores);
        
        if (totalScores === 0) {
            console.log('No scores found in database');
            return res.json([]);
        }

        const countryTotals = await Score.aggregate([
            {
                $match: {
                    'playerData.country': { $exists: true, $ne: null }
                }
            },
            {
                $group: {
                    _id: '$playerData.country',
                    totalScore: { $sum: '$score' }
                }
            },
            {
                $project: {
                    _id: 0,
                    country: '$_id',
                    totalScore: 1
                }
            },
            {
                $sort: { totalScore: -1 }
            }
        ]);

        console.log('Country totals calculated:', countryTotals);

        // If no country totals found, return empty array
        if (!countryTotals || countryTotals.length === 0) {
            console.log('No country totals found after aggregation');
            return res.json([]);
        }

        res.json(countryTotals);
    } catch (error) {
        console.error('Error in getCountryTotals:', error);
        res.status(500).json({ 
            message: 'Failed to retrieve country totals.', 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}; 