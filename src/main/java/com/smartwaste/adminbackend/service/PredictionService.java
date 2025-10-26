package com.smartwaste.adminbackend.service;

import com.smartwaste.adminbackend.model.Bin;
import com.smartwaste.adminbackend.repository.BinRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

// Tribuo imports
import org.tribuo.Example;
import org.tribuo.MutableDataset;
import org.tribuo.Prediction;
import org.tribuo.Model;
import org.tribuo.DataSource;
import org.tribuo.datasource.ListDataSource;
import org.tribuo.impl.ArrayExample;
import org.tribuo.provenance.DataSourceProvenance;
import org.tribuo.provenance.SimpleDataSourceProvenance;
import org.tribuo.regression.Regressor;
import org.tribuo.regression.RegressionFactory;
import org.tribuo.regression.sgd.linear.LinearSGDTrainer;
import org.tribuo.regression.sgd.objectives.SquaredLoss;

import com.oracle.labs.mlrg.olcut.provenance.Provenance;
import org.tribuo.math.optimisers.AdaGrad;
import org.tribuo.math.StochasticGradientOptimiser;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class PredictionService {

    @Autowired
    private BinRepository binRepository;

    private static final RegressionFactory factory = new RegressionFactory();
    private final Map<String, Model<Regressor>> trainedModels = new HashMap<>();

    // ---------------------------------------------------------
    // TRAINING
    // ---------------------------------------------------------
    public String trainBinFillModel(String binId) {
        Optional<Bin> binOpt = binRepository.findById(binId);
        if (binOpt.isEmpty()) {
            return "Error: Bin not found for training.";
        }
        System.out.println("Starting simulated training for bin: " + binId);

        List<Example<Regressor>> trainingData = generateDummyBinDataList(binId);
        if (trainingData.isEmpty()) {
            return "Error: Not enough simulated data for bin " + binId;
        }

        Map<String, Provenance> provenanceMap = new HashMap<>();
        provenanceMap.put("SimulatedData", new SimpleDataSourceProvenance("Simulated data for bin " + binId, factory));
        DataSourceProvenance provenance = new SimpleDataSourceProvenance(provenanceMap);

        DataSource<Regressor> listDataSource = new ListDataSource<>(trainingData, factory, provenance);
        MutableDataset<Regressor> trainingDataset = new MutableDataset<>(listDataSource);

        SquaredLoss objective = new SquaredLoss();
        StochasticGradientOptimiser optimiser = new AdaGrad(0.1);

        LinearSGDTrainer trainer = new LinearSGDTrainer(
                objective,
                optimiser,
                10,
                Math.max(1, trainingDataset.size() / 4),
                1,
                1L
        );

        System.out.println("Training model...");
        long start = System.currentTimeMillis();
        Model<Regressor> model = trainer.train(trainingDataset);
        long end = System.currentTimeMillis();
        System.out.println("Training complete in " + (end - start) + " ms");

        trainedModels.put(binId, model);
        return "Successfully trained prediction model for bin " + binId;
    }

    // ---------------------------------------------------------
    // PREDICTION
    // ---------------------------------------------------------
    public Optional<Double> predictBinFillLevel(String binId, int hoursAhead) {
        Optional<Bin> binOpt = binRepository.findById(binId);
        Model<Regressor> model = trainedModels.get(binId);

        if (binOpt.isEmpty() || model == null) {
            System.err.println("Missing bin or trained model for ID " + binId);
            return Optional.empty();
        }

        Bin bin = binOpt.get();
        LocalDateTime futureTime = LocalDateTime.now().plusHours(hoursAhead);
        Example<Regressor> example = createPredictionExample(bin, futureTime);

        try {
            Prediction<Regressor> prediction = model.predict(example);
            double predicted = prediction.getOutput().getValues()[0];
            predicted = Math.max(0.0, Math.min(100.0, predicted));
            System.out.println("Predicted fill level for bin " + binId + ": " + predicted);
            return Optional.of(predicted);
        } catch (Exception e) {
            e.printStackTrace();
            return Optional.empty();
        }
    }

    // ---------------------------------------------------------
    // HELPER METHODS
    // ---------------------------------------------------------
    private List<Example<Regressor>> generateDummyBinDataList(String binId) {
        List<Example<Regressor>> list = new ArrayList<>();
        Random random = new Random(binId.hashCode());
        LocalDateTime now = LocalDateTime.now();
        double fill = random.nextDouble() * 20;

        for (int i = 0; i < 7 * 4; i++) {
            LocalDateTime timestamp = now.minusHours(i * 6L);

            double inc = 1.0 + random.nextDouble() * 4.0;
            if (timestamp.getDayOfWeek() == DayOfWeek.SATURDAY || timestamp.getDayOfWeek() == DayOfWeek.SUNDAY)
                inc *= 0.5;
            if (timestamp.getHour() < 6 || timestamp.getHour() > 22)
                inc *= 0.3;
            inc *= (0.9 + random.nextDouble() * 0.2);

            if (random.nextDouble() < 0.08 && fill > 60)
                fill = random.nextDouble() * 10.0;
            else
                fill += inc;

            fill = Math.max(0.0, Math.min(100.0, fill));

            Example<Regressor> ex = createExampleFromFeatures(createFeatures(timestamp), fill);
            list.add(ex);
        }

        return list;
    }

    private Example<Regressor> createPredictionExample(Bin bin, LocalDateTime futureTime) {
        Map<String, Double> features = createFeatures(futureTime);
        return createExampleFromFeatures(features, 0.0); // dummy output
    }

    /**
     * ✅ FIXED VERSION:
     * Converts a Map<String,Double> into an ArrayExample
     * using the constructor that takes parallel arrays.
     */
    private Example<Regressor> createExampleFromFeatures(Map<String, Double> features, double fillLevel) {
        String[] featureNames = features.keySet().toArray(new String[0]);
        double[] featureValues = features.values().stream().mapToDouble(Double::doubleValue).toArray();
        Regressor output = new Regressor("FillLevel", fillLevel);
        return new ArrayExample<>(output, featureNames, featureValues);
    }

    private Map<String, Double> createFeatures(LocalDateTime timestamp) {
        Map<String, Double> map = new LinkedHashMap<>();
        map.put("hourOfDay", (double) timestamp.getHour());
        map.put("dayOfWeek", (double) timestamp.getDayOfWeek().getValue());
        map.put("isWeekend", (timestamp.getDayOfWeek() == DayOfWeek.SATURDAY
                || timestamp.getDayOfWeek() == DayOfWeek.SUNDAY) ? 1.0 : 0.0);
        return map;
    }
}
