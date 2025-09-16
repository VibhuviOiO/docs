---
sidebar_position: 6
title: Jupyter Notebook
description: Jupyter Notebook is an open-source web application for creating and sharing documents with live code, equations, visualizations, and narrative text.
slug: /BuildMLTools/Jupyter
keywords:
  - Jupyter
  - Jupyter Notebook
  - JupyterLab
  - data science
  - interactive computing
  - Python notebooks
  - data analysis
  - machine learning
---

# 📓 Interactive Data Science with Jupyter Notebook

**Jupyter Notebook** is an **open-source** web application for creating and sharing documents with **live code**, **equations**, **visualizations**, and **narrative text**. Perfect for **data science**, **machine learning**, **research**, and **educational** purposes with support for **40+ programming languages**.

## Key Features

- **Interactive Computing**: Execute code cells and see results immediately
- **Rich Output**: Display HTML, images, videos, LaTeX, and JavaScript
- **Multiple Kernels**: Support for Python, R, Scala, Julia, and more
- **Extensible**: Rich ecosystem of extensions and widgets
- **Shareable**: Export to HTML, PDF, slides, and more

## Use Cases

- **Data Analysis**: Exploratory data analysis and visualization
- **Machine Learning**: Model development and experimentation
- **Research**: Scientific computing and reproducible research
- **Education**: Interactive learning and teaching materials

---

## 🧰 Prerequisites

- **Python 3.8+** installed
- **Docker & Docker Compose** for containerized setup
- **Web browser** for accessing the notebook interface
- **4GB+ RAM** recommended for data science workloads

---

## 🔧 Step 1: Setup Jupyter Development Environment

Create a Docker Compose setup for Jupyter with data science stack:

```yaml
version: '3.8'

services:
  # JupyterLab with data science stack
  jupyterlab:
    image: jupyter/datascience-notebook:latest
    container_name: jupyterlab-ds
    restart: unless-stopped
    ports:
      - "8888:8888"
      - "8787:8787"  # RStudio Server
    environment:
      - JUPYTER_ENABLE_LAB=yes
      - JUPYTER_TOKEN=jupyter123
      - GRANT_SUDO=yes
      - CHOWN_HOME=yes
      - CHOWN_HOME_OPTS='-R'
    volumes:
      - ./notebooks:/home/jovyan/work/notebooks
      - ./data:/home/jovyan/work/data
      - ./models:/home/jovyan/work/models
      - ./scripts:/home/jovyan/work/scripts
    user: root
    command: >
      bash -c "
        pip install --upgrade pip &&
        pip install mlflow wandb tensorboard &&
        pip install plotly dash streamlit &&
        pip install opencv-python-headless pillow &&
        pip install transformers datasets accelerate &&
        start-notebook.sh --NotebookApp.token='jupyter123' --NotebookApp.password=''
      "

  # PostgreSQL for data storage
  postgres:
    image: postgres:15
    container_name: jupyter-postgres
    restart: unless-stopped
    environment:
      - POSTGRES_DB=datalab
      - POSTGRES_USER=datalab
      - POSTGRES_PASSWORD=datalab123
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./sql:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"

  # Redis for caching
  redis:
    image: redis:7-alpine
    container_name: jupyter-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

  # MinIO for object storage
  minio:
    image: minio/minio:latest
    container_name: jupyter-minio
    restart: unless-stopped
    environment:
      - MINIO_ROOT_USER=minioadmin
      - MINIO_ROOT_PASSWORD=minioadmin123
    volumes:
      - minio_data:/data
    ports:
      - "9000:9000"
      - "9001:9001"
    command: server /data --console-address ":9001"

volumes:
  postgres_data:
  redis_data:
  minio_data:
```

---

## 🏗️ Step 2: Install Jupyter Locally

Install Jupyter with essential data science packages:

```bash
# Install Jupyter and JupyterLab
pip install jupyter jupyterlab

# Install data science packages
pip install pandas numpy matplotlib seaborn plotly
pip install scikit-learn tensorflow torch
pip install requests beautifulsoup4 sqlalchemy

# Install Jupyter extensions
pip install jupyterlab-git
pip install jupyter-dash
pip install ipywidgets

# Install additional kernels
pip install ipykernel

# Start JupyterLab
jupyter lab --ip=0.0.0.0 --port=8888 --no-browser --allow-root
```

---

## 📁 Step 3: Create Your First Data Science Notebook

Create a comprehensive data analysis notebook:

```python
# Cell 1: Setup and Imports
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import warnings
warnings.filterwarnings('ignore')

# Configure plotting
plt.style.use('seaborn-v0_8')
sns.set_palette("husl")
%matplotlib inline

# Configure pandas display
pd.set_option('display.max_columns', None)
pd.set_option('display.max_rows', 100)

print("📊 Data Science Environment Ready!")
print(f"Pandas version: {pd.__version__}")
print(f"NumPy version: {np.__version__}")
print(f"Matplotlib version: {plt.matplotlib.__version__}")
print(f"Seaborn version: {sns.__version__}")
```

```python
# Cell 2: Data Loading and Exploration
# Load sample dataset (using built-in dataset for demo)
from sklearn.datasets import load_boston, load_wine
import pandas as pd

# Load wine dataset
wine_data = load_wine()
df = pd.DataFrame(wine_data.data, columns=wine_data.feature_names)
df['target'] = wine_data.target
df['target_name'] = df['target'].map({0: 'class_0', 1: 'class_1', 2: 'class_2'})

print("🍷 Wine Dataset Loaded!")
print(f"Shape: {df.shape}")
print(f"Features: {len(wine_data.feature_names)}")
print(f"Classes: {len(wine_data.target_names)}")

# Display basic info
display(df.head())
display(df.info())
display(df.describe())
```

```python
# Cell 3: Data Visualization
# Create comprehensive visualizations

# 1. Distribution of target classes
fig, axes = plt.subplots(2, 2, figsize=(15, 12))

# Class distribution
df['target_name'].value_counts().plot(kind='bar', ax=axes[0,0])
axes[0,0].set_title('Distribution of Wine Classes')
axes[0,0].set_xlabel('Wine Class')
axes[0,0].set_ylabel('Count')

# Alcohol content distribution
sns.histplot(data=df, x='alcohol', hue='target_name', ax=axes[0,1])
axes[0,1].set_title('Alcohol Content Distribution by Class')

# Correlation heatmap (top features)
top_features = ['alcohol', 'flavanoids', 'color_intensity', 'od280/od315_of_diluted_wines', 'proline']
corr_matrix = df[top_features + ['target']].corr()
sns.heatmap(corr_matrix, annot=True, cmap='coolwarm', ax=axes[1,0])
axes[1,0].set_title('Correlation Matrix - Top Features')

# Box plot for alcohol by class
sns.boxplot(data=df, x='target_name', y='alcohol', ax=axes[1,1])
axes[1,1].set_title('Alcohol Content by Wine Class')

plt.tight_layout()
plt.show()
```

```python
# Cell 4: Interactive Plotly Visualizations
# Create interactive plots with Plotly

# 3D scatter plot
fig = px.scatter_3d(
    df, 
    x='alcohol', 
    y='flavanoids', 
    z='color_intensity',
    color='target_name',
    title='3D Scatter Plot: Wine Features',
    labels={'target_name': 'Wine Class'}
)
fig.show()

# Interactive correlation heatmap
fig = px.imshow(
    df.select_dtypes(include=[np.number]).corr(),
    title='Interactive Correlation Heatmap',
    color_continuous_scale='RdBu'
)
fig.show()

# Parallel coordinates plot
fig = px.parallel_coordinates(
    df.sample(50),  # Sample for better visualization
    color='target',
    dimensions=['alcohol', 'malic_acid', 'ash', 'alcalinity_of_ash', 'magnesium'],
    title='Parallel Coordinates Plot - Wine Features'
)
fig.show()
```

```python
# Cell 5: Machine Learning Pipeline
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import joblib

# Prepare data
X = df.drop(['target', 'target_name'], axis=1)
y = df['target']

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# Scale features
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

print("🔧 Data prepared for machine learning")
print(f"Training set: {X_train.shape}")
print(f"Test set: {X_test.shape}")

# Train multiple models
models = {
    'Random Forest': RandomForestClassifier(n_estimators=100, random_state=42),
    'Logistic Regression': LogisticRegression(random_state=42, max_iter=1000),
    'SVM': SVC(random_state=42, probability=True)
}

results = {}

for name, model in models.items():
    print(f"\n🚀 Training {name}...")
    
    # Use scaled data for LR and SVM, original for RF
    if name in ['Logistic Regression', 'SVM']:
        model.fit(X_train_scaled, y_train)
        y_pred = model.predict(X_test_scaled)
        cv_scores = cross_val_score(model, X_train_scaled, y_train, cv=5)
    else:
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        cv_scores = cross_val_score(model, X_train, y_train, cv=5)
    
    # Calculate metrics
    accuracy = accuracy_score(y_test, y_pred)
    cv_mean = cv_scores.mean()
    cv_std = cv_scores.std()
    
    results[name] = {
        'model': model,
        'accuracy': accuracy,
        'cv_mean': cv_mean,
        'cv_std': cv_std,
        'predictions': y_pred
    }
    
    print(f"Accuracy: {accuracy:.4f}")
    print(f"CV Score: {cv_mean:.4f} (+/- {cv_std * 2:.4f})")
```

```python
# Cell 6: Model Evaluation and Visualization
# Compare model performance

# Create results DataFrame
results_df = pd.DataFrame({
    'Model': list(results.keys()),
    'Test Accuracy': [results[model]['accuracy'] for model in results.keys()],
    'CV Mean': [results[model]['cv_mean'] for model in results.keys()],
    'CV Std': [results[model]['cv_std'] for model in results.keys()]
})

display(results_df)

# Plot model comparison
fig, axes = plt.subplots(1, 2, figsize=(15, 6))

# Accuracy comparison
results_df.plot(x='Model', y=['Test Accuracy', 'CV Mean'], kind='bar', ax=axes[0])
axes[0].set_title('Model Performance Comparison')
axes[0].set_ylabel('Accuracy')
axes[0].legend()
axes[0].tick_params(axis='x', rotation=45)

# Confusion matrix for best model
best_model_name = results_df.loc[results_df['Test Accuracy'].idxmax(), 'Model']
best_predictions = results[best_model_name]['predictions']

cm = confusion_matrix(y_test, best_predictions)
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', ax=axes[1])
axes[1].set_title(f'Confusion Matrix - {best_model_name}')
axes[1].set_xlabel('Predicted')
axes[1].set_ylabel('Actual')

plt.tight_layout()
plt.show()

print(f"\n🏆 Best Model: {best_model_name}")
print(f"Best Accuracy: {results[best_model_name]['accuracy']:.4f}")

# Detailed classification report
print(f"\n📊 Classification Report - {best_model_name}:")
print(classification_report(y_test, best_predictions, target_names=wine_data.target_names))
```

```python
# Cell 7: Feature Importance Analysis
# Analyze feature importance for Random Forest

rf_model = results['Random Forest']['model']
feature_importance = pd.DataFrame({
    'feature': X.columns,
    'importance': rf_model.feature_importances_
}).sort_values('importance', ascending=False)

# Plot feature importance
plt.figure(figsize=(12, 8))
sns.barplot(data=feature_importance.head(10), x='importance', y='feature')
plt.title('Top 10 Feature Importances - Random Forest')
plt.xlabel('Importance')
plt.tight_layout()
plt.show()

display(feature_importance.head(10))

# Save model and scaler
joblib.dump(rf_model, 'models/wine_classifier.pkl')
joblib.dump(scaler, 'models/scaler.pkl')
print("\n💾 Model and scaler saved!")
```

```python
# Cell 8: Interactive Widgets Demo
import ipywidgets as widgets
from IPython.display import display

# Create interactive plot with widgets
def interactive_scatter(feature_x='alcohol', feature_y='flavanoids'):
    plt.figure(figsize=(10, 6))
    
    for i, class_name in enumerate(wine_data.target_names):
        class_data = df[df['target'] == i]
        plt.scatter(class_data[feature_x], class_data[feature_y], 
                   label=class_name, alpha=0.7, s=50)
    
    plt.xlabel(feature_x.replace('_', ' ').title())
    plt.ylabel(feature_y.replace('_', ' ').title())
    plt.title(f'Wine Classes: {feature_x} vs {feature_y}')
    plt.legend()
    plt.grid(True, alpha=0.3)
    plt.show()

# Create dropdown widgets
feature_options = list(X.columns)
x_dropdown = widgets.Dropdown(options=feature_options, value='alcohol', description='X-axis:')
y_dropdown = widgets.Dropdown(options=feature_options, value='flavanoids', description='Y-axis:')

# Create interactive widget
interactive_plot = widgets.interactive(interactive_scatter, 
                                     feature_x=x_dropdown, 
                                     feature_y=y_dropdown)

display(interactive_plot)
```

---

## ▶️ Step 4: Advanced Jupyter Features

Create a notebook demonstrating advanced features:

```python
# Cell 1: Magic Commands Demo
# Time execution
%timeit sum(range(100))

# Profile code
%prun sum(range(1000))

# Load external Python file
# %load external_script.py

# Run shell commands
!ls -la

# Set environment variables
%env DATA_PATH=/workspace/data

print("🪄 Magic commands demonstrated!")
```

```python
# Cell 2: Custom Functions and Classes
class DataAnalyzer:
    """Custom class for data analysis"""
    
    def __init__(self, dataframe):
        self.df = dataframe
        self.numeric_cols = dataframe.select_dtypes(include=[np.number]).columns
        
    def summary_stats(self):
        """Generate comprehensive summary statistics"""
        summary = {
            'shape': self.df.shape,
            'missing_values': self.df.isnull().sum().sum(),
            'numeric_columns': len(self.numeric_cols),
            'categorical_columns': len(self.df.columns) - len(self.numeric_cols),
            'memory_usage': f"{self.df.memory_usage(deep=True).sum() / 1024**2:.2f} MB"
        }
        return summary
    
    def plot_distributions(self, cols=None, figsize=(15, 10)):
        """Plot distributions of numeric columns"""
        if cols is None:
            cols = self.numeric_cols[:6]  # Limit to first 6 columns
        
        n_cols = 3
        n_rows = (len(cols) + n_cols - 1) // n_cols
        
        fig, axes = plt.subplots(n_rows, n_cols, figsize=figsize)
        axes = axes.flatten() if n_rows > 1 else [axes]
        
        for i, col in enumerate(cols):
            if i < len(axes):
                self.df[col].hist(bins=30, ax=axes[i], alpha=0.7)
                axes[i].set_title(f'Distribution of {col}')
                axes[i].set_xlabel(col)
                axes[i].set_ylabel('Frequency')
        
        # Hide empty subplots
        for i in range(len(cols), len(axes)):
            axes[i].set_visible(False)
        
        plt.tight_layout()
        plt.show()

# Use the custom class
analyzer = DataAnalyzer(df)
print("📈 Data Analysis Summary:")
summary = analyzer.summary_stats()
for key, value in summary.items():
    print(f"  {key}: {value}")

analyzer.plot_distributions()
```

```python
# Cell 3: Database Integration
import sqlite3
import sqlalchemy as sa

# Create in-memory SQLite database
engine = sa.create_engine('sqlite:///:memory:')

# Save DataFrame to database
df.to_sql('wine_data', engine, index=False, if_exists='replace')

# Query data using SQL
query = """
SELECT target_name, 
       AVG(alcohol) as avg_alcohol,
       AVG(flavanoids) as avg_flavanoids,
       COUNT(*) as count
FROM wine_data 
GROUP BY target_name
ORDER BY avg_alcohol DESC
"""

result = pd.read_sql(query, engine)
display(result)

print("🗄️ Database integration successful!")
```

---

## 📊 Step 5: Jupyter Extensions and Customization

Install and configure useful Jupyter extensions:

```bash
# Install JupyterLab extensions
jupyter labextension install @jupyter-widgets/jupyterlab-manager
jupyter labextension install jupyterlab-plotly
jupyter labextension install @jupyterlab/git

# Install nbextensions for classic notebook
pip install jupyter_contrib_nbextensions
jupyter contrib nbextension install --user

# Enable useful extensions
jupyter nbextension enable --py widgetsnbextension
jupyter nbextension enable collapsible_headings/main
jupyter nbextension enable code_folding/main
jupyter nbextension enable table_beautifier/main
```

Create a custom Jupyter configuration:

```python
# jupyter_notebook_config.py
c = get_config()

# Security settings
c.NotebookApp.token = 'your-secure-token'
c.NotebookApp.password = ''

# Network settings
c.NotebookApp.ip = '0.0.0.0'
c.NotebookApp.port = 8888
c.NotebookApp.open_browser = False

# File settings
c.NotebookApp.notebook_dir = '/workspace/notebooks'

# Enable extensions
c.NotebookApp.nbserver_extensions = {
    'jupyter_nbextensions_configurator': True,
}
```

---

## 🔍 What You'll See

### JupyterLab Interface
- **File Browser**: Navigate and manage files
- **Notebook Editor**: Rich text and code editing
- **Terminal**: Integrated command line access
- **Extensions**: Git integration, variable inspector, etc.

### Data Analysis Output
```
📊 Data Science Environment Ready!
Pandas version: 2.1.0
NumPy version: 1.24.3
Matplotlib version: 3.7.2
Seaborn version: 0.12.2

🍷 Wine Dataset Loaded!
Shape: (178, 15)
Features: 13
Classes: 3

🔧 Data prepared for machine learning
Training set: (142, 13)
Test set: (36, 13)

🚀 Training Random Forest...
Accuracy: 0.9722
CV Score: 0.9648 (+/- 0.0704)

🏆 Best Model: Random Forest
Best Accuracy: 0.9722
```

### Interactive Visualizations
- **3D Scatter Plots**: Interactive exploration of data
- **Correlation Heatmaps**: Hover for detailed information
- **Parallel Coordinates**: Filter and highlight data points
- **Widget Controls**: Dynamic parameter adjustment

---

## Pros & Cons

### ✅ Pros
- **Interactive Development**: Immediate feedback and visualization
- **Rich Output**: Support for multimedia and interactive content
- **Extensible**: Large ecosystem of extensions and widgets
- **Shareable**: Easy to share and collaborate on notebooks
- **Multi-language**: Support for 40+ programming languages

### ❌ Cons
- **Version Control**: Notebooks can be challenging to version control
- **Production Deployment**: Not suitable for production applications
- **Resource Usage**: Can consume significant memory and CPU
- **Code Organization**: Can lead to poorly structured code

---

## Conclusion

Jupyter Notebook is the **standard tool** for **interactive data science** and **exploratory analysis**. Choose Jupyter when you need:

- **Interactive development** with immediate feedback
- **Data exploration** and visualization
- **Prototyping** machine learning models
- **Educational content** and documentation

The combination of code, visualizations, and narrative text makes Jupyter ideal for data science workflows, research, and collaborative analysis.

**What You've Achieved:**
✅ Set up a complete Jupyter data science environment  
✅ Created comprehensive data analysis notebooks  
✅ Implemented interactive visualizations and widgets  
✅ Built machine learning pipelines with evaluation  
✅ Integrated databases and external tools  
✅ Configured extensions and customizations