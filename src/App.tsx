// React + TypeScript + Tailwind Pizza Voting App
// Simple frontend to collect pizza vote with name + unique ID

import './index.css'
// import './App.css';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';
import CryptoJS from 'crypto-js'; // Import crypto-js for hashing

// // Supabase client setup from .env file
const supabaseUrl = import.meta.env.VITE_REACT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_REACT_SUPABASE_ANON_KEY;
// console.log("supabaseUrl", supabaseUrl);
// console.log("supabaseAnonKey", supabaseAnonKey);
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const pizzaOptions = [
  'Pepperoni Pizza',
  'Veggie Pizza',
  'Margherita Pizza',
  'BBQ Chicken Pizza'
];

interface Vote {
  block: number;
  timestamp: Date;
  voter_name: string;
  voter_id: string;
  choice: string;
  previous_hash: string;
  current_hash?: string;
}

// function to add the first 'Genesis' block
const insertGenesisBlock = async () => {
  try {
    // Check if the votes table is empty
    const { data: votes, error: fetchError } = await supabase
      .from('votes')
      .select('*')
      .limit(1);

    if (fetchError) {
      console.error('Error checking votes table:', fetchError);
      return;
    }

    if (votes.length === 0) {
      // Create the Genesis Block
      const genesisData: Vote = {
        block: 1,
        timestamp: new Date(),
        voter_name: 'Genesis',
        voter_id: '00000000-0000-0000-0000-000000000000',
        choice: 'Genesis Block',
        previous_hash: '0'.repeat(64),
      };

      // Calculate the current_hash for the Genesis Block
      const currentHash = CryptoJS.SHA256(
        `${genesisData.timestamp}${genesisData.voter_name}${genesisData.voter_id}${genesisData.choice}`
      ).toString();

      const genesisBlock = {
        ...genesisData,
        current_hash: currentHash,
      };

      // Insert the Genesis Block into the database
      const { error: insertError } = await supabase.from('votes').insert([genesisBlock]);

      if (insertError) {
        console.error('Error inserting Genesis Block:', insertError);
      } else {
        console.log('Genesis Block inserted:', genesisBlock);
      }
    } else {
      console.log('Votes table is not empty. Genesis Block already exists.');
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
};

export default function PizzaVotingApp() {

  const [name, setName] = useState('');
  const [voterId, setVoterId] = useState('');
  const [selected, setSelected] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let storedId = localStorage.getItem('voter_id');
    if (!storedId) {
      storedId = uuidv4();
      localStorage.setItem('voter_id', storedId);
    }
    setVoterId(storedId);
  }, []);

  useEffect(() => {
    const checkAndInsertGenesisBlock = async () => {
      try {
        // Check if the votes table is empty
        const { data: votes, error: fetchError } = await supabase
          .from('votes')
          .select('*')
          .limit(1);

        if (fetchError) {
          console.error('Error checking votes table:', fetchError);
          return;
        }

        // Call insertGenesisBlock only if the table is empty
        if (votes.length === 0) {
          await insertGenesisBlock();
        } else {
          console.log('Votes table is not empty. Genesis Block already exists.');
        }
      } catch (error) {
        console.error('Unexpected error:', error);
      }
    };

    checkAndInsertGenesisBlock();
  }, []);

  const handleSubmit = async () => {
    if (!name || !selected) return alert('Please enter your name and select a pizza.');

    try {
      // Fetch the last vote to get its hash
      const { data: lastVote, error: fetchError } = await supabase
        .from('votes')
        .select('current_hash')
        .order('id', { ascending: false })
        .limit(1);

      if (fetchError) {
        console.error('Error fetching last vote:', fetchError);
        toast.error('Error fetching last vote. Try again.');
        return;
      }

      // Set the previous_hash to the current_hash of the last vote (or default for genesis block)
      const previousHash = lastVote?.[0]?.current_hash || '0'.repeat(64);

      // Create the new vote
      const vote: Vote = {
        block: Math.floor(Math.random() * 1000),
        timestamp: new Date(),
        voter_name: name,
        voter_id: voterId,
        choice: selected,
        previous_hash: previousHash,
      };

      // Calculate the current_hash for the new vote
      const currentHash = CryptoJS.SHA256(
        `${vote.timestamp}${vote.voter_name}${vote.voter_id}${vote.choice}`
      ).toString();

      // add the currentHash into the vote
      vote.current_hash = currentHash;

      // Insert the new vote into the database
      const { error: insertError } = await supabase.from('votes').insert([vote]);

      if (insertError) {
        console.error('Error saving vote:', insertError);
        toast.error('Error saving vote. Try again.');
        alert('Failed to save vote. Try again.');
      } else {
        console.log('Vote submitted:', vote);
        toast.success('Vote submitted successfully!');
        setSubmitted(true);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('Unexpected error occurred. Try again.');
    }
  };

  return (
    <div className="container">
      <h1 className="header">🍕 Vote for Your Favorite Pizza</h1>
      <div className="max-w-xl mx-auto p-6 mt-10 bg-white shadow-xl rounded-xl">
        {!submitted ? (
          <>
            {/* Name Input */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Your Name</h2>
              <input
                id="name"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 px-4 py-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Pizza Options */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Choose Your Pizza</h2>
              <div className="space-y-3">
                {pizzaOptions.map((pizza) => (
                  <div key={pizza} className="flex items-center">
                    <input
                      type="radio"
                      id={pizza}
                      name="pizza"
                      value={pizza}
                      checked={selected === pizza}
                      onChange={() => setSelected(pizza)}
                      className="mr-3 h-5 w-5 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor={pizza} className="text-lg">
                      {pizza}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              className="w-full px-6 py-3 rounded-lg text-lg font-semibold hover:bg-green-700 shadow-md"
            >
              Submit Vote
            </button>
          </>
        ) : (
          <div className="text-center">
            <h2 className="text-2xl font-semibold">✅ Thanks for voting, {name}!</h2>
            <p className="text-sm mt-2">Your vote has been recorded (check console for blockchain-style log).</p>
          </div>
        )}

        {/* Link to Blockchain Visualizer */}
        <br />
        <br />
        <div className="text-center mt-6">
          <a
            href="/visualizer"
            className="text-blue-600 underline hover:text-blue-800 text-lg"
          >
            View Blockchain
          </a>
        </div>
      </div>
    </div>
  );
}
