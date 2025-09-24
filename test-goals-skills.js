import axios from 'axios';

const testGoalsSkillsAPI = async () => {
  try {
    console.log('Testing Goals and Skills API...');
    
    // Test GET endpoint
    console.log('\n1. Testing GET /api/user/goals-skills');
    const getResponse = await axios.get('http://localhost:9000/api/user/goals-skills', {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    console.log('GET Response:', getResponse.data);
    
    // Test PUT endpoint
    console.log('\n2. Testing PUT /api/user/goals-skills');
    const putResponse = await axios.put('http://localhost:9000/api/user/goals-skills', {
      goals: ['Test goal 1', 'Test goal 2'],
      skills: ['JavaScript', 'React', 'Node.js']
    }, {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    console.log('PUT Response:', putResponse.data);
    
  } catch (error) {
    console.error('Error testing API:', error.response?.data || error.message);
  }
};

testGoalsSkillsAPI();




