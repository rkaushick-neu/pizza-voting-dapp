import 'react-flow-renderer/dist/style.css';
import { useEffect, useState } from 'react';
import ReactFlow from 'react-flow-renderer';
import type { Node, Edge } from 'react-flow-renderer';
import { Position } from 'react-flow-renderer';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_REACT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_REACT_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Block {
  id: number;
  block: number;
  voter_name: string;
  choice: string;
  current_hash: string;
  previous_hash: string;
}

export default function BlockchainGraph() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Save the original body styles
    const originalBodyStyles = document.body.style.cssText;

    // Apply custom styles for the body
    document.body.style.display = 'block';
    document.body.style.margin = '0';
    document.body.style.placeItems = 'normal';

    return () => {
      // Restore the original body styles when the component unmounts
      document.body.style.cssText = originalBodyStyles;
    };
  }, []);

  useEffect(() => {
    const fetchBlocks = async () => {
      try {
        const { data, error } = await supabase
          .from('votes')
          .select('id, block, voter_name, choice, current_hash, previous_hash')
          .order('id', { ascending: true });

        if (error) {
          console.error('Error fetching blocks:', error);
          return;
        }

        if (data) {
          // Create nodes for each block
          const graphNodes: Node[] = data.map((block, index) => ({
            id: block.current_hash, // Use current_hash as the unique ID
            data: {
              label: (
                <div>
                  <strong>Block #{block.block}</strong>
                  <br />
                  <span>Voter: {block.voter_name}</span>
                  <br />
                  <span>Pizza Choice: {block.choice}</span>
                  <br />
                  <span>Prev Hash: {block.previous_hash.slice(0, 8)}...</span>
                  <br />
                  <span>Current Hash: {block.current_hash.slice(0, 8)}...</span>
                </div>
              ),
            },
            position: { x: index * 200, y: 0 }, // Position nodes horizontally
            sourcePosition: Position.Right,
            targetPosition: Position.Left,
          }));

          // Create edges connecting the blocks
          const graphEdges: Edge[] = data
            .filter((block) => block.previous_hash !== '0'.repeat(64)) // Skip genesis block
            .map((block) => ({
              id: `e-${block.previous_hash}-${block.current_hash}`,
              source: block.previous_hash,
              target: block.current_hash,
              animated: true,
              // label: 'Link',
            }));

          setNodes(graphNodes);
          setEdges(graphEdges);
        }
      } catch (error) {
        console.error('Unexpected error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBlocks();
  }, []);

  if (loading) {
    return <div className="text-center mt-10">Loading blockchain graph...</div>;
  }

  return (
    <div style={{ height: '500px', width: '100%', border: '1px solid #ddd' }}>
      <ReactFlow nodes={nodes} edges={edges} fitView />
    </div>
  );
}