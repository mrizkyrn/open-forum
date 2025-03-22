import pandas as pd
import matplotlib.pyplot as plt
import os
import sys
import glob
from datetime import datetime

# Get the metrics file from command line argument or use the latest file
def get_metrics_file():
    if len(sys.argv) > 1:
        return sys.argv[1]
    
    # Find the latest metrics file if not specified
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    metrics_dir = os.path.join(base_dir, 'results', 'metrics', 'create-discussion')
    metrics_files = glob.glob(os.path.join(metrics_dir, '*.csv'))
    
    if not metrics_files:
        print("No metrics files found in", metrics_dir)
        sys.exit(1)
        
    return max(metrics_files, key=os.path.getctime)

# Main execution
if __name__ == "__main__":
    # Setup paths
    csv_file = get_metrics_file()
    print(f"Analyzing metrics from: {csv_file}")
    
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    output_dir = os.path.join(base_dir, 'results', 'charts')
    
    # Create output directory if needed
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # Get test name from filename
    file_basename = os.path.basename(csv_file)
    test_name = file_basename.split('-')[0]
    timestamp = file_basename.split('-')[1].replace('.csv', '')
    
    # Read data
    df = pd.read_csv(csv_file)
    
    # Convert timestamp to datetime and calculate seconds from start
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    start_time = df['timestamp'].min()
    df['seconds'] = (df['timestamp'] - start_time).dt.total_seconds()
    
    # Create figure with 3 subplots
    fig, axs = plt.subplots(3, 1, figsize=(10, 15))
    fig.suptitle(f'Resource Usage During Load Test: {test_name}', fontsize=16)
    
    # Plot CPU usage
    axs[0].plot(df['seconds'], df['cpu_load'], 'r-', linewidth=2)
    axs[0].set_title('CPU Usage')
    axs[0].set_ylabel('CPU Usage (%)')
    axs[0].set_xlabel('Time (seconds)')
    axs[0].grid(True)
    axs[0].set_ylim(bottom=0)
    
    # Add average line for CPU
    cpu_avg = df['cpu_load'].mean()
    axs[0].axhline(y=cpu_avg, color='darkred', linestyle='--', alpha=0.7)
    axs[0].text(df['seconds'].max()*0.02, cpu_avg*1.1, f'Avg: {cpu_avg:.2f}%', 
                color='darkred', fontweight='bold')
    
    # Plot Memory usage
    axs[1].plot(df['seconds'], df['memory_percent'], 'b-', linewidth=2)
    axs[1].set_title('Memory Usage')
    axs[1].set_ylabel('Memory Usage (%)')
    axs[1].set_xlabel('Time (seconds)')
    axs[1].grid(True)
    axs[1].set_ylim(bottom=0)
    
    # Plot Heap memory
    axs[2].plot(df['seconds'], df['heap_used_mb'], 'g-', linewidth=2, label='Heap Used')
    axs[2].plot(df['seconds'], df['heap_total_mb'], 'g--', linewidth=1.5, label='Heap Total')
    axs[2].set_title('Node.js Heap Memory')
    axs[2].set_ylabel('Memory (MB)')
    axs[2].set_xlabel('Time (seconds)')
    axs[2].legend()
    axs[2].grid(True)
    axs[2].set_ylim(bottom=0)
    
    # Adjust layout
    plt.tight_layout(rect=[0, 0, 1, 0.95])
    
    # Save the combined chart
    chart_path = os.path.join(output_dir, f'{test_name}_resource_metrics.png')
    plt.savefig(chart_path)
    
    # Print key metrics
    print("\nKEY METRICS:")
    print(f"Peak CPU Usage: {df['cpu_load'].max():.2f}%")
    print(f"Average CPU Usage: {df['cpu_load'].mean():.2f}%")
    print(f"Peak Memory Usage: {df['memory_percent'].max():.2f}%")
    print(f"Peak Heap Usage: {df['heap_used_mb'].max():.2f} MB")