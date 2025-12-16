import { Console } from 'console';
import fs from 'fs';
import path from 'path';

const votersFilePath = path.join(process.cwd(), 'voters.json');

export default function handler(req, res) {
    try {
        const votersFilePath = path.join(process.cwd(), 'voters.json');

        if (req.method === 'POST') {
            const newVoter = req.body;

            let voters = [];
            if (fs.existsSync(votersFilePath)) {
                const fileContent = fs.readFileSync(votersFilePath, 'utf-8');
                voters = fileContent ? JSON.parse(fileContent) : [];
            }

            // Check for duplicate NId
            if (voters.some((voter) => voter.status === newVoter.status)) {
                return res.status(400).json({ error: 'Voter with this NId already exists' });
            }

            voters.push(newVoter);
            fs.writeFileSync(votersFilePath, JSON.stringify(voters, null, 2), 'utf-8');
            return res.status(201).json({ message: 'Voter saved successfully' });

        } else if (req.method === 'GET') {
            // Return all voters
            if (fs.existsSync(votersFilePath)) {
                const voters = JSON.parse(fs.readFileSync(votersFilePath, 'utf-8'));
                return res.status(200).json(voters);
            }
            return res.status(200).json([]);
        }

        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
